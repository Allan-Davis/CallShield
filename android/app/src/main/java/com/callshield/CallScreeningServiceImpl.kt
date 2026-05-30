package com.callshield

import android.content.Intent
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
class CallScreeningServiceImpl : CallScreeningService() {
    override fun onScreenCall(callDetails: Call.Details) {
        val phone = callDetails.handle?.schemeSpecificPart ?: ""
        val block = CallShieldPrefs.shouldBlock(this, phone, "call")
        respondToCall(callDetails, CallResponse.Builder()
            .setDisallowCall(block).setRejectCall(block)
            .setSkipCallLog(false).setSkipNotification(block).build())
        startService(Intent(this, CallShieldService::class.java).apply {
            putExtra("event_type","call"); putExtra("phone",phone); putExtra("action",if(block)"blocked" else "allowed")
        })
    }
}
