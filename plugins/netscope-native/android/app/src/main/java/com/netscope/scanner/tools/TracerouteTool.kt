package com.netscope.scanner.tools

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

data class TraceHop(
    val hop: Int,
    val ip: String?,
    val latencyMs: Long?
)

class TracerouteTool {
    fun trace(host: String, maxHops: Int = 30, timeoutMs: Int = 1000): List<TraceHop> {
        val result = ArrayList<TraceHop>()
        val target = try {
            InetAddress.getByName(host)
        } catch (e: Exception) {
            return result
        }
        for (ttl in 1..maxHops.coerceIn(1, 30)) {
            val hop = traceHop(target, ttl, timeoutMs)
            result.add(TraceHop(ttl, hop.first, hop.second))
            if (hop.first == target.hostAddress) break
        }
        return result
    }

    private fun traceHop(target: InetAddress, ttl: Int, timeoutMs: Int): Pair<String?, Long?> {
        var socket: DatagramSocket? = null
        return try {
            socket = DatagramSocket()
            socket.soTimeout = timeoutMs
            socket.timeToLive = ttl
            val payload = ByteArray(32) { 0x41 }
            val start = System.nanoTime()
            socket.send(DatagramPacket(payload, payload.size, target, 33434))
            val buffer = ByteArray(512)
            val packet = DatagramPacket(buffer, buffer.size)
            socket.receive(packet)
            val latency = (System.nanoTime() - start) / 1_000_000
            Pair(packet.address.hostAddress, latency)
        } catch (e: java.net.SocketTimeoutException) {
            Pair(null, null)
        } catch (e: Exception) {
            Pair(null, null)
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }
}
