package com.callshield

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.os.Build
import android.provider.ContactsContract
import android.telecom.TelecomManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallShieldModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName() = "CallShieldModule"

    override fun initialize() {
        super.initialize()
        CallShieldService.emitter = { type, phone ->
            try {
                val map = Arguments.createMap()
                map.putString("phone", phone)
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(if (type == "call") "onIncomingCall" else "onIncomingSMS", map)
            } catch (e: Exception) {}
        }
    }

    override fun invalidate() {
        super.invalidate()
        CallShieldService.emitter = null
    }

    @ReactMethod
    fun endCall(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val tm = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
                if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS) == PackageManager.PERMISSION_GRANTED) {
                    tm.endCall(); promise.resolve(true); return
                }
            }
            val tm = ctx.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            val m = Class.forName(tm.javaClass.name).getDeclaredMethod("endCall")
            m.isAccessible = true; m.invoke(tm)
            promise.resolve(true)
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun requestCallScreeningRole(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val rm = ctx.getSystemService(android.app.role.RoleManager::class.java)
                val intent = rm.createRequestRoleIntent(android.app.role.RoleManager.ROLE_CALL_SCREENING)
                ctx.currentActivity?.startActivityForResult(intent, 1001)
                promise.resolve(true)
            } catch (e: Exception) { promise.resolve(false) }
        } else { promise.resolve(false) }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val result = Arguments.createMap()
        val perms = mapOf(
            "READ_PHONE_STATE" to Manifest.permission.READ_PHONE_STATE,
            "READ_CALL_LOG" to Manifest.permission.READ_CALL_LOG,
            "RECEIVE_SMS" to Manifest.permission.RECEIVE_SMS,
            "READ_SMS" to Manifest.permission.READ_SMS,
            "READ_CONTACTS" to Manifest.permission.READ_CONTACTS,
        )
        for ((k,v) in perms) result.putBoolean(k, ContextCompat.checkSelfPermission(ctx, v) == PackageManager.PERMISSION_GRANTED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            result.putBoolean("ANSWER_PHONE_CALLS", ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS) == PackageManager.PERMISSION_GRANTED)
        else result.putBoolean("ANSWER_PHONE_CALLS", true)
        promise.resolve(result)
    }

    @ReactMethod
    fun getContacts(promise: Promise) {
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("NO_PERMISSION", "Contacts permission not granted"); return
        }
        val list = Arguments.createArray()
        val cursor: Cursor? = ctx.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER, ContactsContract.CommonDataKinds.Phone.CONTACT_ID),
            null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )
        cursor?.use {
            val ni = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val pi = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
            val ii = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
            val seen = mutableSetOf<String>()
            while (it.moveToNext()) {
                val id = it.getString(ii) ?: continue
                val name = it.getString(ni) ?: ""
                val phone = it.getString(pi)?.replace("\\s".toRegex(),"") ?: continue
                if (seen.add("$id-$phone")) {
                    val m = Arguments.createMap()
                    m.putString("id", id); m.putString("name", name); m.putString("phone", phone)
                    list.pushMap(m)
                }
            }
        }
        promise.resolve(list)
    }

    @ReactMethod
    fun setShieldState(active: Boolean, blockCalls: Boolean, blockSMS: Boolean, whitelist: ReadableArray, promise: Promise) {
        CallShieldPrefs.saveState(ctx, active, blockCalls, blockSMS, whitelist)
        promise.resolve(true)
    }

    @ReactMethod
    fun startForegroundService(promise: Promise) {
        try {
            val intent = Intent(ctx, CallShieldService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(intent)
            else ctx.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        ctx.stopService(Intent(ctx, CallShieldService::class.java))
        promise.resolve(true)
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
