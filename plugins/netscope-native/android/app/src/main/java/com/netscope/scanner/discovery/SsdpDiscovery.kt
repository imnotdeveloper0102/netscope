package com.netscope.scanner.discovery

import android.content.Context
import android.net.wifi.WifiManager
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket

class SsdpDiscovery(private val context: Context) {
    fun discover(timeoutMs: Int = 3000): Map<String, String> {
        val result = LinkedHashMap<String, String>()
        var socket: MulticastSocket? = null
        var lock: WifiManager.MulticastLock? = null
        try {
            val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            lock = wifi.createMulticastLock("netscope-ssdp")
            lock.setReferenceCounted(true)
            lock.acquire()
            socket = MulticastSocket(1900)
            socket.soTimeout = timeoutMs
            val group = InetAddress.getByName("239.255.255.250")
            socket.joinGroup(group)
            val request = "M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 2\r\nST: ssdp:all\r\n\r\n"
            val requestBytes = request.toByteArray(Charsets.UTF_8)
            socket.send(DatagramPacket(requestBytes, requestBytes.size, group, 1900))
            val deadline = System.currentTimeMillis() + timeoutMs
            val buffer = ByteArray(4096)
            while (System.currentTimeMillis() < deadline) {
                try {
                    val packet = DatagramPacket(buffer, buffer.size)
                    socket.receive(packet)
                    val text = String(packet.data, 0, packet.length, Charsets.UTF_8)
                    val ip = packet.address.hostAddress ?: continue
                    val server = parseHeader(text, "SERVER") ?: parseHeader(text, "USN") ?: "SSDP"
                    if (!result.containsKey(ip)) {
                        result[ip] = server
                    }
                } catch (e: java.net.SocketTimeoutException) {
                    break
                }
            }
            socket.leaveGroup(group)
        } catch (e: Exception) {
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
            try {
                if (lock != null && lock.isHeld) lock.release()
            } catch (ignored: Exception) {}
        }
        return result
    }

    private fun parseHeader(text: String, name: String): String? {
        for (line in text.lines()) {
            if (line.startsWith(name, ignoreCase = true)) {
                val value = line.substringAfter(":", "").trim()
                if (value.isNotEmpty()) return value
            }
        }
        return null
    }
}
