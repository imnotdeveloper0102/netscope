package com.netscope.scanner.bridge

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.netscope.scanner.discovery.MdnsDiscovery
import com.netscope.scanner.discovery.SsdpDiscovery
import com.netscope.scanner.portscan.BannerGrabber
import com.netscope.scanner.portscan.PortScanner
import com.netscope.scanner.scanner.DeviceInfo
import com.netscope.scanner.scanner.LanScanner
import com.netscope.scanner.scanner.SubnetCalculator
import com.netscope.scanner.storage.DeviceMeta
import com.netscope.scanner.storage.OuiLookup
import com.netscope.scanner.storage.ScanRecord
import com.netscope.scanner.storage.ScanStore
import com.netscope.scanner.tools.DnsTool
import com.netscope.scanner.tools.PingTool
import com.netscope.scanner.tools.TracerouteTool
import com.netscope.scanner.tools.WakeOnLanTool
import com.netscope.scanner.wifi.WifiInfoProvider
import com.netscope.scanner.wifi.WifiScanResult
import com.netscope.scanner.wifi.WifiScanner
import com.netscope.scanner.worker.StrangerCheckWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class NetScopeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var currentScanJob: Job? = null
    private val store: ScanStore by lazy { ScanStore(reactContext) }
    private val oui: OuiLookup by lazy { OuiLookup(reactContext) }

    override fun getName(): String = "NetScope"

    override fun invalidate() {
        super.invalidate()
        scope.cancel()
    }

    private fun sendEvent(name: String, params: WritableMap?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(name, params)
        } catch (e: Exception) {
        }
    }

    @ReactMethod
    fun getNetworkInfo(promise: Promise) {
        scope.launch {
            try {
                val info = WifiInfoProvider(reactContext).getInfo()
                val map = Arguments.createMap()
                map.putString("ssid", info.ssid)
                map.putString("ssidUnavailableReason", info.ssidUnavailableReason)
                map.putString("bssid", info.bssid)
                map.putString("ip", info.ip)
                map.putString("subnetMask", info.subnetMask)
                map.putString("gateway", info.gateway)
                map.putString("dns1", info.dns1)
                map.putString("dns2", info.dns2)
                if (info.frequencyMhz != null) map.putInt("frequencyMhz", info.frequencyMhz)
                if (info.channel != null) map.putInt("channel", info.channel)
                map.putString("band", info.band)
                if (info.linkSpeedMbps != null) map.putInt("linkSpeedMbps", info.linkSpeedMbps)
                if (info.rssiDbm != null) map.putInt("rssiDbm", info.rssiDbm)
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("NETWORK_INFO_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getWifiInfo(promise: Promise) {
        getNetworkInfo(promise)
    }

    @ReactMethod
    fun startLanScan(localIp: String, prefix: Int, timeoutMs: Int, concurrency: Int, promise: Promise) {
        currentScanJob?.cancel()
        currentScanJob = scope.launch {
            try {
                val wifi = WifiInfoProvider(reactContext).getInfo()
                val gateway = wifi.gateway
                val hosts = SubnetCalculator.hostsForLocalIp(localIp, prefix)
                val known = store.getLastScan()?.devices?.map { it.ip }?.toSet() ?: emptySet()
                val mdns = try { MdnsDiscovery(reactContext).discover(2000L) } catch (e: Exception) { emptyMap() }
                val ssdp = try { SsdpDiscovery(reactContext).discover(2000) } catch (e: Exception) { emptyMap() }
                val devices = LanScanner().scan(
                    hosts = hosts,
                    localIp = localIp,
                    gatewayIp = gateway,
                    knownIps = known,
                    timeoutMs = timeoutMs,
                    concurrency = concurrency,
                    onProgress = { scanned, total ->
                        val map = Arguments.createMap()
                        map.putInt("scanned", scanned)
                        map.putInt("total", total)
                        sendEvent("NetScopeScanProgress", map)
                    },
                    onDevice = { device ->
                        sendEvent("NetScopeDeviceFound", deviceToMap(enrich(device, mdns, ssdp)))
                    }
                )
                val enriched = devices.map { enrich(it, mdns, ssdp) }
                val subnet = "${SubnetCalculator.networkAddress(localIp, prefix)}/$prefix"
                store.saveScan(subnet, enriched)
                val done = Arguments.createMap()
                done.putInt("total", enriched.size)
                done.putArray("devices", devicesToArray(enriched))
                sendEvent("NetScopeScanFinished", done)
                withContext(Dispatchers.Main) {
                    promise.resolve(enriched.size)
                }
            } catch (e: kotlinx.coroutines.CancellationException) {
                withContext(Dispatchers.Main) {
                    promise.reject("SCAN_CANCELLED", "Quét đã bị hủy")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SCAN_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun cancelScan() {
        currentScanJob?.cancel()
    }

    @ReactMethod
    fun scanPorts(ip: String, ports: ReadableArray, timeoutMs: Int, promise: Promise) {
        scope.launch {
            try {
                val list = ArrayList<Int>()
                for (i in 0 until ports.size()) {
                    list.add(ports.getInt(i))
                }
                val results = PortScanner().scan(ip, list, timeoutMs) { port ->
                    try { BannerGrabber.grab(ip, port, 2000) } catch (e: Exception) { null }
                }
                val array = Arguments.createArray()
                for (result in results) {
                    val map = Arguments.createMap()
                    map.putInt("port", result.port)
                    map.putString("state", result.state.name.lowercase())
                    if (result.latencyMs != null) map.putDouble("latencyMs", result.latencyMs.toDouble())
                    map.putString("banner", result.banner)
                    map.putString("service", result.service)
                    array.pushMap(map)
                }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("PORT_SCAN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getWifiNetworks(promise: Promise) {
        scope.launch {
            try {
                val result = WifiScanner(reactContext).scan()
                val map = Arguments.createMap()
                when (result) {
                    is WifiScanResult.Success -> {
                        map.putBoolean("throttled", false)
                        map.putInt("suggestedChannel24", result.suggestedChannel24)
                        map.putInt("suggestedChannel5", result.suggestedChannel5)
                        val array = Arguments.createArray()
                        for (network in result.networks) {
                            val item = Arguments.createMap()
                            item.putString("ssid", network.ssid)
                            item.putString("bssid", network.bssid)
                            item.putInt("frequencyMhz", network.frequencyMhz)
                            item.putInt("channel", network.channel)
                            item.putInt("levelDbm", network.levelDbm)
                            item.putString("capabilities", network.capabilities)
                            array.pushMap(item)
                        }
                        map.putArray("networks", array)
                    }
                    is WifiScanResult.Throttled -> {
                        map.putBoolean("throttled", true)
                        map.putDouble("nextAllowedInMs", result.nextAllowedInMs.toDouble())
                        val array = Arguments.createArray()
                        for (network in result.cached) {
                            val item = Arguments.createMap()
                            item.putString("ssid", network.ssid)
                            item.putString("bssid", network.bssid)
                            item.putInt("frequencyMhz", network.frequencyMhz)
                            item.putInt("channel", network.channel)
                            item.putInt("levelDbm", network.levelDbm)
                            item.putString("capabilities", network.capabilities)
                            array.pushMap(item)
                        }
                        map.putArray("networks", array)
                    }
                    is WifiScanResult.Unavailable -> {
                        map.putBoolean("throttled", false)
                        map.putString("unavailableReason", result.reason)
                        map.putArray("networks", Arguments.createArray())
                    }
                }
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("WIFI_SCAN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun pingHost(host: String, count: Int, promise: Promise) {
        scope.launch {
            try {
                val result = PingTool().ping(host, count)
                val map = Arguments.createMap()
                map.putString("host", result.host)
                map.putInt("sent", result.sent)
                map.putInt("received", result.received)
                map.putInt("packetLossPercent", result.packetLossPercent)
                if (result.minMs != null) map.putDouble("minMs", result.minMs.toDouble())
                if (result.avgMs != null) map.putDouble("avgMs", result.avgMs.toDouble())
                if (result.maxMs != null) map.putDouble("maxMs", result.maxMs.toDouble())
                val array = Arguments.createArray()
                for (latency in result.latenciesMs) {
                    if (latency != null) array.pushDouble(latency.toDouble()) else array.pushNull()
                }
                map.putArray("latenciesMs", array)
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("PING_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun traceroute(host: String, maxHops: Int, promise: Promise) {
        scope.launch {
            try {
                val hops = TracerouteTool().trace(host, maxHops)
                val array = Arguments.createArray()
                for (hop in hops) {
                    val map = Arguments.createMap()
                    map.putInt("hop", hop.hop)
                    map.putString("ip", hop.ip)
                    if (hop.latencyMs != null) map.putDouble("latencyMs", hop.latencyMs.toDouble())
                    array.pushMap(map)
                }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("TRACEROUTE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun dnsLookup(host: String, promise: Promise) {
        scope.launch {
            try {
                val result = DnsTool().lookup(host)
                val map = Arguments.createMap()
                map.putString("host", result.host)
                map.putDouble("lookupMs", result.lookupMs.toDouble())
                val array = Arguments.createArray()
                for (address in result.addresses) array.pushString(address)
                map.putArray("addresses", array)
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("DNS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun wakeOnLan(mac: String, broadcastIp: String, promise: Promise) {
        scope.launch {
            try {
                WakeOnLanTool.send(mac, broadcastIp)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("WOL_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getScanHistory(promise: Promise) {
        try {
            val history = store.getHistory()
            val array = Arguments.createArray()
            for (record in history) {
                val map = Arguments.createMap()
                map.putDouble("id", record.id.toDouble())
                map.putDouble("timestamp", record.timestamp.toDouble())
                map.putString("subnet", record.subnet)
                map.putInt("deviceCount", record.devices.size)
                map.putArray("devices", devicesToArray(record.devices))
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("HISTORY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun saveDeviceName(key: String, name: String, note: String, promise: Promise) {
        try {
            val existing = store.getDeviceMeta(key)
            store.saveDeviceMeta(key, DeviceMeta(name.ifEmpty { null }, note.ifEmpty { null }, existing?.trusted ?: false))
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_DEVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setDeviceTrusted(key: String, trusted: Boolean, promise: Promise) {
        try {
            val existing = store.getDeviceMeta(key)
            store.saveDeviceMeta(key, DeviceMeta(existing?.customName, existing?.note, trusted))
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_DEVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun compareScans(firstIndex: Int, secondIndex: Int, promise: Promise) {
        try {
            val history = store.getHistory()
            val first = history.getOrNull(firstIndex) ?: run { promise.reject("COMPARE_ERROR", "Không tìm thấy lần quét thứ nhất"); return }
            val second = history.getOrNull(secondIndex) ?: run { promise.reject("COMPARE_ERROR", "Không tìm thấy lần quét thứ hai"); return }
            val diff = store.compareScans(first, second)
            val map = Arguments.createMap()
            map.putArray("newDevices", devicesToArray(diff.newDevices))
            map.putArray("disappearedDevices", devicesToArray(diff.disappearedDevices))
            map.putArray("unchangedDevices", devicesToArray(diff.unchangedDevices))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("COMPARE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun exportScan(index: Int, format: String, promise: Promise) {
        try {
            val history = store.getHistory()
            val record = history.getOrNull(index) ?: run { promise.reject("EXPORT_ERROR", "Không tìm thấy lần quét"); return }
            if (format == "csv") {
                val builder = StringBuilder()
                builder.append("ip,hostname,mac,latencyMs,isGateway,isSelf\n")
                for (device in record.devices) {
                    builder.append("${device.ip},${device.hostname ?: ""},${device.mac ?: ""},${device.latencyMs ?: ""},${device.isGateway},${device.isSelf}\n")
                }
                promise.resolve(builder.toString())
            } else {
                val builder = StringBuilder()
                builder.append("{\"subnet\":\"${record.subnet}\",\"timestamp\":${record.timestamp},\"devices\":[")
                for ((i, device) in record.devices.withIndex()) {
                    if (i > 0) builder.append(",")
                    builder.append("{\"ip\":\"${device.ip}\",\"hostname\":${if (device.hostname == null) "null" else "\"${device.hostname}\""},\"mac\":${if (device.mac == null) "null" else "\"${device.mac}\""},\"latencyMs\":${device.latencyMs ?: "null"},\"isGateway\":${device.isGateway},\"isSelf\":${device.isSelf}}")
                }
                builder.append("]}")
                promise.resolve(builder.toString())
            }
        } catch (e: Exception) {
            promise.reject("EXPORT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setStrangerCheckEnabled(enabled: Boolean, promise: Promise) {
        try {
            store.setStrangerCheckEnabled(enabled)
            val workManager = WorkManager.getInstance(reactContext)
            if (enabled) {
                val request = PeriodicWorkRequestBuilder<StrangerCheckWorker>(15, TimeUnit.MINUTES).build()
                workManager.enqueueUniquePeriodicWork("netscope_stranger_check", ExistingPeriodicWorkPolicy.UPDATE, request)
            } else {
                workManager.cancelUniqueWork("netscope_stranger_check")
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WORKER_ERROR", e.message, e)
        }
    }

    private fun enrich(device: DeviceInfo, mdns: Map<String, String>, ssdp: Map<String, String>): DeviceInfo {
        val hostname = device.hostname ?: mdns[device.ip] ?: ssdp[device.ip]
        val vendor = device.vendor ?: oui.lookup(device.mac)
        val meta = store.getDeviceMeta(device.ip)
        return device.copy(hostname = hostname, vendor = vendor)
    }

    private fun deviceToMap(device: DeviceInfo): WritableMap {
        val map = Arguments.createMap()
        map.putString("ip", device.ip)
        map.putString("hostname", device.hostname)
        map.putString("mac", device.mac)
        map.putString("macUnavailableReason", device.macUnavailableReason)
        if (device.latencyMs != null) map.putDouble("latencyMs", device.latencyMs.toDouble())
        map.putBoolean("isGateway", device.isGateway)
        map.putBoolean("isSelf", device.isSelf)
        map.putBoolean("isNew", device.isNew)
        map.putString("vendor", device.vendor)
        val meta = store.getDeviceMeta(device.ip)
        map.putString("customName", meta?.customName)
        map.putString("note", meta?.note)
        map.putBoolean("trusted", meta?.trusted ?: false)
        val openPortsArray = Arguments.createArray()
        for (port in device.openPorts) openPortsArray.pushInt(port)
        map.putArray("openPorts", openPortsArray)
        return map
    }

    private fun devicesToArray(devices: List<DeviceInfo>): WritableArray {
        val array = Arguments.createArray()
        for (device in devices) array.pushMap(deviceToMap(device))
        return array
    }
}
