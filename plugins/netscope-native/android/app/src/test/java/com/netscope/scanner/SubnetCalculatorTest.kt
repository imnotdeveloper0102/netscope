package com.netscope.scanner

import com.netscope.scanner.scanner.SubnetCalculator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SubnetCalculatorTest {
    @Test
    fun prefixToMask_24() {
        assertEquals(0xFFFFFF00L, SubnetCalculator.prefixToMask(24))
    }

    @Test
    fun maskToPrefix_24() {
        assertEquals(24, SubnetCalculator.maskToPrefix(0xFFFFFF00L))
    }

    @Test
    fun networkAddress_24() {
        assertEquals("192.168.1.0", SubnetCalculator.networkAddress("192.168.1.42", 24))
    }

    @Test
    fun broadcastAddress_24() {
        assertEquals("192.168.1.255", SubnetCalculator.broadcastAddress("192.168.1.42", 24))
    }

    @Test
    fun hostsInSubnet_24_has254() {
        val hosts = SubnetCalculator.hostsInSubnet("192.168.1.0", 24)
        assertEquals(254, hosts.size)
        assertEquals("192.168.1.1", hosts.first())
        assertEquals("192.168.1.254", hosts.last())
    }

    @Test
    fun hostsForLocalIp_largeSubnet_returnsSingle24Slice() {
        val hosts = SubnetCalculator.hostsForLocalIp("10.0.5.20", 16)
        assertEquals(254, hosts.size)
        assertTrue(hosts.contains("10.0.5.1"))
        assertTrue(hosts.contains("10.0.5.254"))
    }
}
