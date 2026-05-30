package com.callshield

import android.content.*
import android.os.Build

class ServiceRestartReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val svc = Intent(context, CallShieldService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(svc)
        else context.startService(svc)
    }
}
