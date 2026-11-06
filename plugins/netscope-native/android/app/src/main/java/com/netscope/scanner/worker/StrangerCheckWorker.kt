package com.netscope.scanner.worker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.netscope.scanner.scanner.LanScanner
import com.netscope.scanner.scanner.SubnetCalculator
import com.netscope.scanner.storage.ScanStore
import com.netscope.scanner.wifi.WifiInfoProvider

class StrangerCheckWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val store = ScanStore(applicationContext)
        if (!store.isStrangerCheckEnabled()) return Result.success()
        val wifi = WifiInfoProvider(applicationContext).getInfo()
        val localIp = wifi.ip ?: return Result.success()
        val prefix = 24
        val hosts = SubnetCalculator.hostsForLocalIp(localIp, prefix)
        val last = store.getLastScan()
        val known = last?.devices?.map { it.ip }?.toSet() ?: emptySet()
        val gateway = wifi.gateway
        val found = ArrayList<String>()
        LanScanner().scan(
            hosts = hosts,
            localIp = localIp,
            gatewayIp = gateway,
            knownIps = known,
            timeoutMs = 800,
            concurrency = 32,
            onProgress = { _, _ -> },
            onDevice = { device ->
                if (!device.isSelf && !device.isGateway && !known.contains(device.ip)) {
                    if (!store.isTrusted(device.ip)) {
                        found.add(device.ip)
                    }
                }
            }
        )
        if (found.isNotEmpty()) {
            showNotification(found)
        }
        return Result.success()
    }

    private fun showNotification(newIps: List<String>) {
        try {
            val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channelId = "netscope_stranger"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(channelId, "Thiết bị lạ", NotificationManager.IMPORTANCE_DEFAULT)
                manager.createNotificationChannel(channel)
            }
            val text = "Phát hiện ${newIps.size} thiết bị mới: ${newIps.take(3).joinToString(", ")}"
            val notification = NotificationCompat.Builder(applicationContext, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("NetScope: thiết bị lạ vào mạng")
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .build()
            manager.notify(1001, notification)
        } catch (e: Exception) {
        }
    }
}
