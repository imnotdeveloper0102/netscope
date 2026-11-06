package com.netscope.scanner.storage

import android.content.Context
import org.json.JSONObject

class OuiLookup(context: Context) {
    private val table: Map<String, String> = load(context)

    private fun load(context: Context): Map<String, String> {
        return try {
            val raw = context.assets.open("oui.json").bufferedReader().use { it.readText() }
            val obj = JSONObject(raw)
            val map = LinkedHashMap<String, String>()
            val keys = obj.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                map[key.uppercase()] = obj.optString(key)
            }
            map
        } catch (e: Exception) {
            emptyMap()
        }
    }

    fun lookup(mac: String?): String? {
        if (mac == null) return null
        val clean = mac.replace(":", "").replace("-", "").uppercase()
        if (clean.length < 6) return null
        return table[clean.substring(0, 6)]
    }
}
