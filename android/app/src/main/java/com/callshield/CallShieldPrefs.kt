package com.callshield

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReadableArray
import org.json.JSONArray
import org.json.JSONObject

object CallShieldPrefs {
    private const val PREFS = "CallShieldPrefs"
    private val FINTECH = setOf("234","200","22214","20880","100","135","247")
    private val FINTECH_RE = listOf(Regex("^2\\d{2}$"), Regex("^1\\d{2}$"), Regex("MPESA",RegexOption.IGNORE_CASE), Regex("AIRTEL",RegexOption.IGNORE_CASE))

    private fun prefs(ctx: Context): SharedPreferences = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun saveState(ctx: Context, active: Boolean, blockCalls: Boolean, blockSMS: Boolean, whitelist: ReadableArray) {
        val arr = JSONArray()
        for (i in 0 until whitelist.size()) {
            val m = whitelist.getMap(i) ?: continue
            arr.put(JSONObject().apply {
                put("phone", normalize(m.getString("phone") ?: ""))
                put("allowCalls", m.getBoolean("allowCalls"))
                put("allowSMS", m.getBoolean("allowSMS"))
            })
        }
        prefs(ctx).edit().putBoolean("active",active).putBoolean("blockCalls",blockCalls)
            .putBoolean("blockSMS",blockSMS).putString("whitelist",arr.toString()).apply()
    }

    fun isActive(ctx: Context) = prefs(ctx).getBoolean("active", false)
    fun blockCalls(ctx: Context) = prefs(ctx).getBoolean("blockCalls", true)
    fun blockSMS(ctx: Context) = prefs(ctx).getBoolean("blockSMS", true)

    fun normalize(phone: String): String {
        var p = phone.replace("\\s".toRegex(), "")
        if (p.startsWith("+254")) p = "0" + p.substring(4)
        if (p.startsWith("254") && p.length > 9) p = "0" + p.substring(3)
        return p
    }

    fun isFintech(phone: String): Boolean {
        val c = phone.replace("\\s".toRegex(), "")
        return FINTECH.contains(c) || FINTECH_RE.any { it.containsMatchIn(c) }
    }

    fun shouldBlock(ctx: Context, phone: String, type: String): Boolean {
        if (isFintech(phone)) return false
        if (!isActive(ctx)) return false
        val norm = normalize(phone)
        val wl = JSONArray(prefs(ctx).getString("whitelist","[]") ?: "[]")
        for (i in 0 until wl.length()) {
            val obj = wl.getJSONObject(i)
            if (obj.getString("phone") == norm || obj.getString("phone") == phone) {
                return if (type == "call") !obj.optBoolean("allowCalls", true)
                       else !obj.optBoolean("allowSMS", true)
            }
        }
        return if (type == "call") blockCalls(ctx) else blockSMS(ctx)
    }
}
