package com.netscope.scanner.util

object NetworkUtils {
    fun ipToLong(ip: String): Long {
        val parts = ip.split(".")
        if (parts.size != 4) return -1L
        var result = 0L
        for (part in parts) {
            val value = part.toIntOrNull() ?: return -1L
            if (value < 0 || value > 255) return -1L
            result = (result shl 8) or value.toLong()
        }
        return result
    }

    fun longToIp(value: Long): String {
        return "${(value shr 24) and 0xFF}.${(value shr 16) and 0xFF}.${(value shr 8) and 0xFF}.${value and 0xFF}"
    }

    fun intToIp(value: Int): String {
        return "${value and 0xFF}.${(value shr 8) and 0xFF}.${(value shr 16) and 0xFF}.${(value ushr 24) and 0xFF}"
    }

    fun isValidIp(ip: String): Boolean = ipToLong(ip) >= 0L

    fun isPrivateIp(ip: String): Boolean {
        val value = ipToLong(ip)
        if (value < 0L) return false
        val first = (value shr 24) and 0xFF
        val second = (value shr 16) and 0xFF
        return first == 10L || (first == 172L && second in 16L..31L) || (first == 192L && second == 168L)
    }

    fun parseMac(mac: String): ByteArray? {
        val clean = mac.replace(":", "").replace("-", "").replace(".", "")
        if (clean.length != 12) return null
        return try {
            ByteArray(6) { i -> clean.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
        } catch (e: NumberFormatException) {
            null
        }
    }

    fun formatMac(bytes: ByteArray): String {
        return bytes.joinToString(":") { "%02X".format(it) }
    }
}
