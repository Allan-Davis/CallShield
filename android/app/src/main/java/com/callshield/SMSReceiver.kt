package com.callshield

import android.content.*
import android.provider.Telephony

class SMSReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        msgs.groupBy { it.originatingAddress ?: "" }.forEach { (phone, _) ->
            if (phone.isEmpty()) return@forEach
            val block = CallShieldPrefs.shouldBlock(context, phone, "sms")
            if (block) abortBroadcast()
            context.startService(Intent(context, CallShieldService::class.java).apply {
                putExtra("event_type","sms"); putExtra("phone",phone); putExtra("action",if(block)"blocked" else "allowed")
            })
        }
    }
}
