package com.netscope.scanner.discovery

import java.net.InetAddress

object ReverseDnsResolver {
    fun resolve(ip: String): String? {
        return try {
            val address = InetAddress.getByName(ip)
            val name = address.canonicalHostName
            if (name == null || name == ip) null else name
        } catch (e: Exception) {
            null
        }
    }
}
