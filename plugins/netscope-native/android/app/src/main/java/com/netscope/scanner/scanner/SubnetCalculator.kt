package com.netscope.scanner.scanner

import com.netscope.scanner.util.NetworkUtils

object SubnetCalculator {
    fun prefixToMask(prefix: Int): Long {
        if (prefix <= 0) return 0L
        if (prefix >= 32) return 0xFFFFFFFFL
        return (0xFFFFFFFFL shl (32 - prefix)) and 0xFFFFFFFFL
    }

    fun maskToPrefix(mask: Long): Int {
        var count = 0
        var value = mask and 0xFFFFFFFFL
        while (value and 0x80000000L != 0L) {
            count++
            value = (value shl 1) and 0xFFFFFFFFL
        }
        return count
    }

    fun networkAddress(ip: String, prefix: Int): String {
        val ipValue = NetworkUtils.ipToLong(ip)
        if (ipValue < 0L) return ip
        return NetworkUtils.longToIp(ipValue and prefixToMask(prefix))
    }

    fun broadcastAddress(ip: String, prefix: Int): String {
        val ipValue = NetworkUtils.ipToLong(ip)
        if (ipValue < 0L) return ip
        val mask = prefixToMask(prefix)
        return NetworkUtils.longToIp(ipValue or (mask.inv() and 0xFFFFFFFFL))
    }

    fun hostsInSubnet(networkIp: String, prefix: Int): List<String> {
        val network = NetworkUtils.ipToLong(networkAddress(networkIp, prefix))
        if (network < 0L) return emptyList()
        val broadcast = NetworkUtils.ipToLong(broadcastAddress(networkIp, prefix))
        val total = broadcast - network - 1
        if (total <= 0L) return emptyList()
        val count = minOf(total, 254L)
        val result = ArrayList<String>(count.toInt())
        var current = network + 1
        while (current < network + 1 + count) {
            result.add(NetworkUtils.longToIp(current))
            current++
        }
        return result
    }

    fun hostsForLocalIp(localIp: String, prefix: Int): List<String> {
        if (prefix >= 24) return hostsInSubnet(localIp, prefix)
        val sliceNetwork = networkAddress(localIp, 24)
        return hostsInSubnet(sliceNetwork, 24)
    }
}
