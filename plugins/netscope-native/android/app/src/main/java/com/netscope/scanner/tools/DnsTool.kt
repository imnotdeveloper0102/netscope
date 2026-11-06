package com.netscope.scanner.tools

import java.net.InetAddress
import java.net.UnknownHostException

data class DnsResult(
    val host: String,
    val addresses: List<String>,
    val lookupMs: Long
)

class DnsTool {
    fun lookup(host: String): DnsResult {
        val start = System.nanoTime()
        return try {
            val addresses = InetAddress.getAllByName(host)
            DnsResult(
                host = host,
                addresses = addresses.mapNotNull { it.hostAddress },
                lookupMs = (System.nanoTime() - start) / 1_000_000
            )
        } catch (e: UnknownHostException) {
            throw IllegalArgumentException("Không phân giải được tên miền: $host")
        }
    }
}
