package com.netscope.scanner.discovery

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class MdnsDiscovery(private val context: Context) {
    suspend fun discover(timeoutMs: Long = 4000L): Map<String, String> {
        val result = LinkedHashMap<String, String>()
        val manager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
        val types = listOf("_http._tcp.", "_printer._tcp.", "_ssh._tcp.")
        for (type in types) {
            val found = discoverType(manager, type, timeoutMs)
            for ((ip, name) in found) {
                if (!result.containsKey(ip)) result[ip] = name
            }
        }
        return result
    }

    private suspend fun discoverType(manager: NsdManager, type: String, timeoutMs: Long): Map<String, String> {
        val result = LinkedHashMap<String, String>()
        return suspendCancellableCoroutine { cont ->
            val listener = object : NsdManager.DiscoveryListener {
                override fun onDiscoveryStarted(serviceType: String) {}
                override fun onDiscoveryStopped(serviceType: String) {}
                override fun onServiceFound(service: NsdServiceInfo) {
                    manager.resolveService(service, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}
                        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
                            val ip = serviceInfo.host?.hostAddress
                            if (ip != null) {
                                synchronized(result) { result[ip] = serviceInfo.serviceName }
                            }
                        }
                    })
                }
                override fun onServiceLost(service: NsdServiceInfo) {}
                override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {}
                override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
            }
            try {
                manager.discoverServices(type, NsdManager.PROTOCOL_DNS_SD, listener)
            } catch (e: Exception) {
                if (cont.isActive) cont.resume(result)
                return@suspendCancellableCoroutine
            }
            cont.invokeOnCancellation {
                try { manager.stopServiceDiscovery(listener) } catch (ignored: Exception) {}
            }
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                try { manager.stopServiceDiscovery(listener) } catch (ignored: Exception) {}
                if (cont.isActive) cont.resume(result)
            }, timeoutMs)
        }
    }
}
