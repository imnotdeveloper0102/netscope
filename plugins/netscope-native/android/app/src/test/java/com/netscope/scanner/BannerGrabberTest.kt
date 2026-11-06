package com.netscope.scanner

import com.netscope.scanner.portscan.BannerGrabber
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BannerGrabberTest {
    @Test
    fun parseHttpServer_found() {
        val headers = "HTTP/1.1 200 OK\r\nServer: nginx/1.24.0\r\nContent-Type: text/html\r\n"
        assertEquals("nginx/1.24.0", BannerGrabber.parseHttpServer(headers))
    }

    @Test
    fun parseHttpServer_missing_returnsNull() {
        assertNull(BannerGrabber.parseHttpServer("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n"))
    }

    @Test
    fun parseBannerLine_trimsAndCaps() {
        assertEquals("SSH-2.0-OpenSSH_9.2", BannerGrabber.parseBannerLine("  SSH-2.0-OpenSSH_9.2\r\n"))
    }
}
