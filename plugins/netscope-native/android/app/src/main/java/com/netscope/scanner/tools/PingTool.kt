package com.netscope.scanner.tools

import java.net.InetAddress

data class PingResult(
    val host: String,
    val latenciesMs: List<Long?>,
    val sent: Int,
    val received: Int,
    val packetLossPercent: Int,
    val minMs: Long?,
    val avgMs: Long?,
    val maxMs: Long?
)

class PingTool {
    fun ping(host: String, count: Int, timeoutMs: Int = 1000): PingResult {
        val latencies = ArrayList<Long?>()
        var received = 0
        for (i in 0 until count.coerceIn(1, 100)) {
            val latency = pingOnce(host, timeoutMs)
            latencies.add(latency)
            if (latency != null) received++
        }
        val ok = latencies.filterNotNull()
        val sent = latencies.size
        val loss = if (sent == 0) 100 else ((sent - received) * 100 / sent)
        return PingResult(
            host = host,
            latenciesMs = latencies,
            sent = sent,
            received = received,
            packetLossPercent = loss,
            minMs = ok.minOrNull(),
            avgMs = if (ok.isEmpty()) null else ok.average().toLong(),
            maxMs = ok.maxOrNull()
        )
    }

    fun pingOnce(host: String, timeoutMs: Int): Long? {
        return try {
            val address = InetAddress.getByName(host)
            val start = System.nanoTime()
            val reachable = address.isReachable(timeoutMs)
            if (!reachable) null else (System.nanoTime() - start) / 1_000_000
        } catch (e: Exception) {
            null
        }
    }
}
