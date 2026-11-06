package com.netscope.scanner.portscan

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.InetSocketAddress
import java.net.Socket

object BannerGrabber {
    fun grab(ip: String, port: Int, timeoutMs: Int = 2000): String? {
        return when (port) {
            80, 8080, 8000 -> grabHttp(ip, port, timeoutMs)
            22 -> grabLine(ip, port, timeoutMs)
            21, 25, 110, 143 -> grabLine(ip, port, timeoutMs)
            else -> grabLine(ip, port, timeoutMs)
        }
    }

    private fun grabHttp(ip: String, port: Int, timeoutMs: Int): String? {
        var socket: Socket? = null
        return try {
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeoutMs)
            socket.soTimeout = timeoutMs
            val out = socket.getOutputStream()
            out.write("HEAD / HTTP/1.0\r\nHost: $ip\r\n\r\n".toByteArray(Charsets.US_ASCII))
            out.flush()
            val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.US_ASCII))
            val firstLine = reader.readLine() ?: return null
            var server: String? = null
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                if (line!!.startsWith("Server:", ignoreCase = true)) {
                    server = line!!.substringAfter(":", "").trim()
                    break
                }
                if (line!!.isEmpty()) break
            }
            if (server != null) "$firstLine | Server: $server" else firstLine
        } catch (e: Exception) {
            null
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }

    private fun grabLine(ip: String, port: Int, timeoutMs: Int): String? {
        var socket: Socket? = null
        return try {
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeoutMs)
            socket.soTimeout = timeoutMs
            val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.US_ASCII))
            val line = reader.readLine()
            if (line.isNullOrEmpty()) null else parseBannerLine(line)
        } catch (e: Exception) {
            null
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }

    fun parseBannerLine(line: String): String {
        return line.trim().take(200)
    }

    fun parseHttpServer(headers: String): String? {
        for (line in headers.lines()) {
            if (line.startsWith("Server:", ignoreCase = true)) {
                val value = line.substringAfter(":", "").trim()
                if (value.isNotEmpty()) return value
            }
        }
        return null
    }
}
