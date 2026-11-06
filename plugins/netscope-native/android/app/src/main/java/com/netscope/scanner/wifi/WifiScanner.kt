package com.netscope.scanner.wifi

import android.content.Context
import android.net.wifi.ScanResult
import android.net.wifi.WifiManager

data class WifiNetwork(
    val ssid: String,
    val bssid: String,
    val frequencyMhz: Int,
    val channel: Int,
    val levelDbm: Int,
    val capabilities: String
)

sealed class WifiScanResult {
    data class Success(val networks: List<WifiNetwork>, val suggestedChannel24: Int, val suggestedChannel5: Int) : WifiScanResult()
    data class Throttled(val nextAllowedInMs: Long, val cached: List<WifiNetwork>) : WifiScanResult()
    data class Unavailable(val reason: String) : WifiScanResult()
}

class WifiScanner(private val context: Context) {
    private var lastScanAt = 0L

    fun scan(): WifiScanResult {
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        if (!wifi.isWifiEnabled) {
            return WifiScanResult.Unavailable("Wi-Fi đang tắt")
        }
        val now = System.currentTimeMillis()
        val started = try {
            wifi.startScan()
        } catch (e: SecurityException) {
            return WifiScanResult.Unavailable("Thiếu quyền vị trí để quét Wi-Fi")
        }
        if (!started) {
            val elapsed = now - lastScanAt
            if (lastScanAt > 0L && elapsed < 120_000L) {
                return WifiScanResult.Throttled(
                    nextAllowedInMs = 120_000L - elapsed,
                    cached = mapResults(wifi.scanResults)
                )
            }
            return WifiScanResult.Unavailable("WifiManager.startScan bị từ chối, thử lại sau")
        }
        lastScanAt = now
        Thread.sleep(1500)
        val networks = mapResults(wifi.scanResults)
        return WifiScanResult.Success(
            networks = networks,
            suggestedChannel24 = suggestChannel(networks, listOf(1, 6, 11)),
            suggestedChannel5 = suggestChannel(networks, listOf(36, 44, 149, 157))
        )
    }

    private fun mapResults(results: List<ScanResult>): List<WifiNetwork> {
        val provider = WifiInfoProvider(context)
        return results
            .filter { it.SSID != null && it.SSID.isNotEmpty() }
            .map {
                WifiNetwork(
                    ssid = it.SSID,
                    bssid = it.BSSID ?: "Không khả dụng",
                    frequencyMhz = it.frequency,
                    channel = provider.channelFromFrequency(it.frequency),
                    levelDbm = it.level,
                    capabilities = it.capabilities ?: ""
                )
            }
            .sortedByDescending { it.levelDbm }
    }

    private fun suggestChannel(networks: List<WifiNetwork>, candidates: List<Int>): Int {
        var best = candidates.first()
        var bestCount = Int.MAX_VALUE
        for (channel in candidates) {
            val count = networks.count { it.channel == channel }
            if (count < bestCount) {
                bestCount = count
                best = channel
            }
        }
        return best
    }
}
