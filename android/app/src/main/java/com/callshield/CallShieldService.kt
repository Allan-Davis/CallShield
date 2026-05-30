package com.callshield

import android.app.*
import android.content.*
import android.os.*
import androidx.core.app.NotificationCompat

class CallShieldService : Service() {
    companion object {
        const val CHANNEL_ID = "CallShieldCh"
        const val NOTIF_ID = 1001
        var emitter: ((String, String) -> Unit)? = null
    }

    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(NOTIF_ID, buildNotif("CallShield is protecting your calls & SMS"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            val type = it.getStringExtra("event_type") ?: return@let
            val phone = it.getStringExtra("phone") ?: return@let
            val action = it.getStringExtra("action") ?: return@let
            try { emitter?.invoke(type, phone) } catch (e: Exception) {}
            if (action == "blocked") updateNotif("Blocked ${if(type=="call") "call" else "SMS"} from $phone")
        }
        return START_STICKY
    }

    private fun buildNotif(text: String): Notification {
        val pi = PendingIntent.getActivity(this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CallShield").setContentText(text)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pi).setOngoing(true).setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW).build()
    }

    private fun updateNotif(text: String) {
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIF_ID, buildNotif(text))
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(NotificationChannel(CHANNEL_ID, "CallShield", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Background protection service"; setShowBadge(false)
                })
        }
    }

    override fun onBind(intent: Intent?) = null

    override fun onDestroy() {
        super.onDestroy()
        emitter = null
        sendBroadcast(Intent("com.callshield.RESTART_SERVICE"))
    }
}
