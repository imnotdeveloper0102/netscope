package com.netscope.scanner.discovery

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

object NetBiosResolver {
    fun query(ip: String, timeoutMs: Int = 1000): String? {
        var socket: DatagramSocket? = null
        return try {
            socket = DatagramSocket()
            socket.soTimeout = timeoutMs
            val packet = buildNameQuery()
            val address = InetAddress.getByName(ip)
            socket.send(DatagramPacket(packet, packet.size, address, 137))
            val buffer = ByteArray(1024)
            val response = DatagramPacket(buffer, buffer.size)
            socket.receive(response)
            parseName(buffer, response.length)
        } catch (e: Exception) {
            null
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }

    private fun buildNameQuery(): ByteArray {
        val transactionId = (Math.random() * 65535).toInt()
        val out = ByteArray(50)
        out[0] = (transactionId shr 8).toByte()
        out[1] = transactionId.toByte()
        out[2] = 0x01
        out[3] = 0x10
        out[4] = 0x00
        out[5] = 0x01
        out[6] = 0x00
        out[7] = 0x00
        out[8] = 0x00
        out[9] = 0x00
        out[10] = 0x00
        out[11] = 0x00
        out[12] = 0x20
        out[13] = 0x43
        out[14] = 0x4B
        for (i in 15 until 47) {
            out[i] = 0x41
        }
        out[47] = 0x00
        out[48] = 0x00
        out[49] = 0x21
        return out
    }

    private fun parseName(buffer: ByteArray, length: Int): String? {
        if (length < 60) return null
        val nameBytes = buffer.copyOfRange(57, 72)
        val name = String(nameBytes, Charsets.US_ASCII).trim()
        if (name.isEmpty()) return null
        return name
    }
}
