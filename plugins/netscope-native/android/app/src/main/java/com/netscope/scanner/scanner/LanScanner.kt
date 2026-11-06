package com.netscope.scanner.scanner

import com.netscope.scanner.discovery.ReverseDnsResolver
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.withTimeoutOrNull

data class DeviceInfo(
    val ip: String,
    val hostname: String?,
    val mac: String?,
    val macUnavailableReason: String?,
    val latencyMs: Long?,
    val isGateway: Boolean,
    val isSelf: Boolean,
    val isNew: Boolean,
    val vendor: String?,
    val openPorts: List<Int> = emptyList()
)

class LanScanner {
    suspend fun scan(
        hosts: List<String>,
        localIp: String?,
        gatewayIp: String?,
        knownIps: Set<String>,
        timeoutMs: Int,
        concurrency: Int,
        onProgress: (scanned: Int, total: Int) -> Unit,
        onDevice: (DeviceInfo) -> Unit
    ): List<DeviceInfo> {
        val found = mutableListOf<DeviceInfo>()
        val semaphore = Semaphore(concurrency.coerceIn(1, 128))
        var scanned = 0
        coroutineScope {
            val jobs = hosts.map { ip ->
                async {
                    semaphore.acquire()
                    try {
                        val device = probe(ip, localIp, gatewayIp, knownIps, timeoutMs)
                        if (device != null) {
                            synchronized(found) { found.add(device) }
                            onDevice(device)
                        }
                    } finally {
                        semaphore.release()
                        synchronized(this@LanScanner) {
                            scanned++
                            onProgress(scanned, hosts.size)
                        }
                    }
                }
            }
            jobs.awaitAll()
        }
        return found.sortedBy { it.ip.split(".").mapNotNull { part -> part.toIntOrNull() } }
    }

    private suspend fun probe(
        ip: String,
        localIp: String?,
        gatewayIp: String?,
        knownIps: Set<String>,
        timeoutMs: Int
    ): DeviceInfo? {
        val start = System.nanoTime()
        val reachable = withTimeoutOrNull(timeoutMs.toLong()) {
            try {
                InetAddress.getByName(ip).isReachable(timeoutMs)
            } catch (e: Exception) {
                false
            }
        } ?: false
        var latency: Long? = null
        var alive = reachable
        if (alive) {
            latency = (System.nanoTime() - start) / 1_000_000
        } else {
            for (port in intArrayOf(80, 443, 135, 445)) {
                val ok = tryTcp(ip, port, timeoutMs / 2)
                if (ok != null) {
                    alive = true
                    latency = ok
                    break
                }
            }
        }
        if (!alive) return null
        val hostname = ReverseDnsResolver.resolve(ip)
        return DeviceInfo(
            ip = ip,
            hostname = hostname,
            mac = null,
            macUnavailableReason = "Android 10 trở lên chặn đọc /proc/net/arp",
            latencyMs = latency,
            isGateway = ip == gatewayIp,
            isSelf = ip == localIp,
            isNew = !knownIps.contains(ip),
            vendor = null
        )
    }

    private fun tryTcp(ip: String, port: Int, timeoutMs: Int): Long? {
        var socket: Socket? = null
        return try {
            val start = System.nanoTime()
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeoutMs.coerceAtLeast(200))
            (System.nanoTime() - start) / 1_000_000
        } catch (e: Exception) {
            null
        } finally {
            try { socket?.close() } catch (ignored: Exception) {}
        }
    }
}
