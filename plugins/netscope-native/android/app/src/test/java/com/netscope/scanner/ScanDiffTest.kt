package com.netscope.scanner

import com.netscope.scanner.scanner.DeviceInfo
import com.netscope.scanner.storage.ScanRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ScanDiffTest {
    private fun device(ip: String): DeviceInfo {
        return DeviceInfo(ip, null, null, null, null, false, false, false, null)
    }

    private fun record(devices: List<DeviceInfo>): ScanRecord {
        return ScanRecord(1L, 1000L, "192.168.1.0/24", devices)
    }

    @Test
    fun compareScans_detectsNewAndDisappeared() {
        val oldScan = record(listOf(device("192.168.1.1"), device("192.168.1.2")))
        val newScan = record(listOf(device("192.168.1.2"), device("192.168.1.3")))
        val oldByIp = oldScan.devices.associateBy { it.ip }
        val newByIp = newScan.devices.associateBy { it.ip }
        val newDevices = newScan.devices.filter { !oldByIp.containsKey(it.ip) }
        val disappeared = oldScan.devices.filter { !newByIp.containsKey(it.ip) }
        val unchanged = newScan.devices.filter { oldByIp.containsKey(it.ip) }
        assertEquals(listOf("192.168.1.3"), newDevices.map { it.ip })
        assertEquals(listOf("192.168.1.1"), disappeared.map { it.ip })
        assertEquals(listOf("192.168.1.2"), unchanged.map { it.ip })
        assertTrue(newDevices.isNotEmpty())
    }
}
