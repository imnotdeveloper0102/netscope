package com.netscope.scanner.storage

import android.content.Context
import com.netscope.scanner.scanner.DeviceInfo
import org.json.JSONArray
import org.json.JSONObject

data class ScanRecord(
    val id: Long,
    val timestamp: Long,
    val subnet: String,
    val devices: List<DeviceInfo>
)

data class ScanDiff(
    val newDevices: List<DeviceInfo>,
    val disappearedDevices: List<DeviceInfo>,
    val unchangedDevices: List<DeviceInfo>
)

data class DeviceMeta(
    val customName: String?,
    val note: String?,
    val trusted: Boolean
)

class ScanStore(context: Context) {
    private val prefs = context.getSharedPreferences("netscope_scans", Context.MODE_PRIVATE)

    fun saveScan(subnet: String, devices: List<DeviceInfo>): ScanRecord {
        val record = ScanRecord(System.currentTimeMillis(), System.currentTimeMillis(), subnet, devices)
        val history = getHistory().toMutableList()
        history.add(0, record)
        while (history.size > 50) history.removeAt(history.size - 1)
        prefs.edit().putString("history", encodeHistory(history)).apply()
        prefs.edit().putString("last_scan", encodeRecord(record)).apply()
        return record
    }

    fun getHistory(): List<ScanRecord> {
        val raw = prefs.getString("history", null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            val result = ArrayList<ScanRecord>()
            for (i in 0 until array.length()) {
                decodeRecord(array.getJSONObject(i))?.let { result.add(it) }
            }
            result
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun getLastScan(): ScanRecord? {
        val raw = prefs.getString("last_scan", null) ?: return null
        return try {
            decodeRecord(JSONObject(raw))
        } catch (e: Exception) {
            null
        }
    }

    fun compareScans(oldScan: ScanRecord, newScan: ScanRecord): ScanDiff {
        val oldByIp = oldScan.devices.associateBy { it.ip }
        val newByIp = newScan.devices.associateBy { it.ip }
        val newDevices = newScan.devices.filter { !oldByIp.containsKey(it.ip) }
        val disappeared = oldScan.devices.filter { !newByIp.containsKey(it.ip) }
        val unchanged = newScan.devices.filter { oldByIp.containsKey(it.ip) }
        return ScanDiff(newDevices, disappeared, unchanged)
    }

    fun saveDeviceMeta(key: String, meta: DeviceMeta) {
        val obj = JSONObject()
        obj.put("customName", meta.customName ?: JSONObject.NULL)
        obj.put("note", meta.note ?: JSONObject.NULL)
        obj.put("trusted", meta.trusted)
        prefs.edit().putString("device_meta_$key", obj.toString()).apply()
    }

    fun getDeviceMeta(key: String): DeviceMeta? {
        val raw = prefs.getString("device_meta_$key", null) ?: return null
        return try {
            val obj = JSONObject(raw)
            DeviceMeta(
                customName = if (obj.isNull("customName")) null else obj.optString("customName"),
                note = if (obj.isNull("note")) null else obj.optString("note"),
                trusted = obj.optBoolean("trusted", false)
            )
        } catch (e: Exception) {
            null
        }
    }

    fun isTrusted(key: String): Boolean = getDeviceMeta(key)?.trusted ?: false

    fun setStrangerCheckEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("stranger_check_enabled", enabled).apply()
    }

    fun isStrangerCheckEnabled(): Boolean = prefs.getBoolean("stranger_check_enabled", false)

    private fun encodeHistory(history: List<ScanRecord>): String {
        val array = JSONArray()
        for (record in history) array.put(encodeRecordJson(record))
        return array.toString()
    }

    private fun encodeRecord(record: ScanRecord): String = encodeRecordJson(record).toString()

    private fun encodeRecordJson(record: ScanRecord): JSONObject {
        val obj = JSONObject()
        obj.put("id", record.id)
        obj.put("timestamp", record.timestamp)
        obj.put("subnet", record.subnet)
        val devices = JSONArray()
        for (device in record.devices) {
            val d = JSONObject()
            d.put("ip", device.ip)
            d.put("hostname", device.hostname ?: JSONObject.NULL)
            d.put("mac", device.mac ?: JSONObject.NULL)
            d.put("latencyMs", device.latencyMs ?: JSONObject.NULL)
            d.put("isGateway", device.isGateway)
            d.put("isSelf", device.isSelf)
            devices.put(d)
        }
        obj.put("devices", devices)
        return obj
    }

    private fun decodeRecord(obj: JSONObject): ScanRecord? {
        return try {
            val devices = ArrayList<DeviceInfo>()
            val array = obj.optJSONArray("devices") ?: JSONArray()
            for (i in 0 until array.length()) {
                val d = array.getJSONObject(i)
                devices.add(
                    DeviceInfo(
                        ip = d.optString("ip"),
                        hostname = if (d.isNull("hostname")) null else d.optString("hostname"),
                        mac = if (d.isNull("mac")) null else d.optString("mac"),
                        macUnavailableReason = null,
                        latencyMs = if (d.isNull("latencyMs")) null else d.optLong("latencyMs"),
                        isGateway = d.optBoolean("isGateway", false),
                        isSelf = d.optBoolean("isSelf", false),
                        isNew = false,
                        vendor = null
                    )
                )
            }
            ScanRecord(
                id = obj.optLong("id"),
                timestamp = obj.optLong("timestamp"),
                subnet = obj.optString("subnet"),
                devices = devices
            )
        } catch (e: Exception) {
            null
        }
    }
}
