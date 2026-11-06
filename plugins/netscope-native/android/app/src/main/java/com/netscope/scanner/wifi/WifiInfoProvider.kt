package com.netscope.scanner.wifi

import android.content.Context
import android.net.ConnectivityManager
import android.net.wifi.WifiManager
import com.netscope.scanner.util.NetworkUtils
import java.net.InetAddress

data class WifiInfo(
    val ssid: String?,
    val ssidUnavailableReason: String?,
    val bssid: String?,
    val ip: String?,
    val subnetMask: String?,
    val gateway: String?,
    val dns1: String?,
    val dns2: String?,
    val frequencyMhz: Int?,
    val channel: Int?,
    val band: String?,
    val linkSpeedMbps: Int?,
    val rssiDbm: Int?
)

class WifiInfoProvider(private val context: Context) {
    fun getInfo(): WifiInfo {
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val connection = wifi.connectionInfo
        val connectivity = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivity.activeNetwork
        val linkProperties = connectivity.getLinkProperties(network)
        var gateway: String? = null
        var dns1: String? = null
        var dns2: String? = null
        var subnetMask: String? = null
        if (linkProperties != null) {
            for (route in linkProperties.routes) {
                if (route.isDefaultRoute) {
                    gateway = route.gateway?.hostAddress
                }
            }
            val servers = linkProperties.dnsServers
            if (servers.isNotEmpty()) dns1 = servers[0].hostAddress
            if (servers.size > 1) dns2 = servers[1].hostAddress
            for (linkAddress in linkProperties.linkAddresses) {
                if (linkAddress.address is java.net.Inet4Address) {
                    val prefix = linkAddress.prefixLength
                    subnetMask = NetworkUtils.longToIp(SubnetMaskHelper.prefixToMask(prefix))
                }
            }
        }
        val rawSsid = connection.ssid
        val ssid = if (rawSsid == null || rawSsid == "<unknown ssid>" || rawSsid == "0x") null else rawSsid.removeSurrounding("\"")
        val ssidReason = if (ssid == null) "Cần quyền vị trí và bật dịch vụ vị trí để đọc SSID" else null
        val frequency = if (connection.frequency > 0) connection.frequency else null
        val channel = frequency?.let { channelFromFrequency(it) }
        val band = frequency?.let { bandFromFrequency(it) }
        val ip = if (connection.ipAddress != 0) NetworkUtils.intToIp(connection.ipAddress) else null
        val bssid = if (connection.bssid == "02:00:00:00:00:00" || connection.bssid.isNullOrEmpty()) null else connection.bssid
        return WifiInfo(
            ssid = ssid,
            ssidUnavailableReason = ssidReason,
            bssid = bssid,
            ip = ip,
            subnetMask = subnetMask,
            gateway = gateway,
            dns1 = dns1,
            dns2 = dns2,
            frequencyMhz = frequency,
            channel = channel,
            band = band,
            linkSpeedMbps = if (connection.linkSpeed > 0) connection.linkSpeed else null,
            rssiDbm = connection.rssi
        )
    }

    fun channelFromFrequency(frequencyMhz: Int): Int {
        return when {
            frequencyMhz in 2412..2484 -> (frequencyMhz - 2407) / 5
            frequencyMhz in 5170..5825 -> (frequencyMhz - 5000) / 5
            frequencyMhz in 5925..7125 -> (frequencyMhz - 5950) / 5
            else -> 0
        }
    }

    fun bandFromFrequency(frequencyMhz: Int): String {
        return when {
            frequencyMhz in 2400..2500 -> "2.4 GHz"
            frequencyMhz in 5000..5900 -> "5 GHz"
            frequencyMhz in 5925..7125 -> "6 GHz"
            else -> "Không xác định"
        }
    }

    private object SubnetMaskHelper {
        fun prefixToMask(prefix: Int): Long {
            if (prefix <= 0) return 0L
            if (prefix >= 32) return 0xFFFFFFFFL
            return (0xFFFFFFFFL shl (32 - prefix)) and 0xFFFFFFFFL
        }
    }
}
