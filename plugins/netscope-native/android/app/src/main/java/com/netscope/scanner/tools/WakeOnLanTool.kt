package com.netscope.scanner.tools

import com.netscope.scanner.util.NetworkUtils
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

object WakeOnLanTool {
    fun send(mac: String, broadcastIp: String = "255.255.255.255", port: Int = 9) {
        val macBytes = NetworkUtils.parseMac(mac)
            ?: throw IllegalArgumentException("Địa chỉ MAC không hợp lệ: $mac")
        val packet = ByteArray(6 + 16 * macBytes.size)
        for (i in 0 until 6) packet[i] = 0xFF.toByte()
        for (i in 0 until 16) {
            System.arraycopy(macBytes, 0, packet, 6 + i * macBytes.size, macBytes.size)
        }
        var socket: DatagramSocket? = null
        try {
            socket = DatagramSocket()
            socket.broadcast = true
            val address = InetAddress.getByName(broadcastIp)
            socket.send(DatagramPacket(packet, packet.size, address, port))
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }
}
