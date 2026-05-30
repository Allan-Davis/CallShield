package com.callshield

import android.content.*
import android.os.Build
import android.telecom.TelecomManager
import android.telephony.TelephonyManager
import android.util.Log

class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        if (intent.getStringExtra(TelephonyManager.EXTRA_STATE) != TelephonyManager.EXTRA_STATE_RINGING) return
        val phone = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: return
        val block = CallShieldPrefs.shouldBlock(context, phone, "call")
        val svcIntent = Intent(context, CallShieldService::class.java).apply {
            putExtra("event_type","call"); putExtra("phone",phone); putExtra("action",if(block)"blocked" else "allowed")
        }
        context.startService(svcIntent)
        if (block) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    (context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager).endCall()
                } else {
                    val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                    val m = Class.forName(tm.javaClass.name).getDeclaredMethod("endCall")
                    m.isAccessible = true; m.invoke(tm)
                }
            } catch (e: Exception) { Log.e("CallShield","endCall failed: ${e.message}") }
        }
    }
}
