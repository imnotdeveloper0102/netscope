package com.netscope.scanner.portscan

import java.net.InetSocketAddress
import java.net.Socket
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore

enum class PortState { OPEN, CLOSED, FILTERED }

data class PortResult(
    val port: Int,
    val state: PortState,
    val latencyMs: Long?,
    val banner: String?,
    val service: String?
)

class PortScanner {
    suspend fun scan(
        ip: String,
        ports: List<Int>,
        timeoutMs: Int,
        onBanner: ((Int) -> String?)? = null
    ): List<PortResult> {
        if (ports.size > 1024) {
            throw IllegalArgumentException("Chỉ quét tối đa 1024 cổng một lần")
        }
        val semaphore = Semaphore(32)
        return coroutineScope {
            val jobs = ports.map { port ->
                async {
                    semaphore.acquire()
                    try {
                        probe(ip, port, timeoutMs, onBanner)
                    } finally {
                        semaphore.release()
                    }
                }
            }
            jobs.awaitAll().sortedBy { it.port }
        }
    }

    private fun probe(ip: String, port: Int, timeoutMs: Int, onBanner: ((Int) -> String?)?): PortResult {
        var socket: Socket? = null
        val start = System.nanoTime()
        return try {
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeoutMs)
            val latency = (System.nanoTime() - start) / 1_000_000
            val banner = try { onBanner?.invoke(port) } catch (e: Exception) { null }
            PortResult(port, PortState.OPEN, latency, banner, serviceName(port))
        } catch (e: java.net.SocketTimeoutException) {
            PortResult(port, PortState.FILTERED, null, null, serviceName(port))
        } catch (e: java.net.ConnectException) {
            PortResult(port, PortState.CLOSED, null, null, serviceName(port))
        } catch (e: Exception) {
            PortResult(port, PortState.FILTERED, null, null, serviceName(port))
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }

    fun serviceName(port: Int): String? {
        return when (port) {
            21 -> "FTP"
            22 -> "SSH"
            23 -> "Telnet"
            53 -> "DNS"
            80 -> "HTTP"
            443 -> "HTTPS"
            445 -> "SMB"
            554 -> "RTSP"
            3389 -> "RDP"
            8080 -> "HTTP-Alt"
            8443 -> "HTTPS-Alt"
            3306 -> "MySQL"
            5432 -> "PostgreSQL"
            6379 -> "Redis"
            else -> null
        }
    }
}
