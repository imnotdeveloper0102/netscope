import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { NetScopeBridge } from '../services/bridge/NetScopeBridge';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';

export function ToolsScreen() {
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const [host, setHost] = useState('8.8.8.8');
  const [mac, setMac] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setResult('');
    try {
      const value = await fn();
      setResult(JSON.stringify(value, null, 2));
    } catch (e: any) {
      setResult(e?.message ?? 'Lỗi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.tools.title}</Text>
      <TextInput style={styles.input} placeholder={t.tools.host} placeholderTextColor={colors.textFaint} value={host} onChangeText={setHost} autoCapitalize="none" />
      <View style={styles.row}>
        <GlassButton label={t.tools.ping} primary onPress={() => run(() => NetScopeBridge.pingHost(host, 4))} />
        <GlassButton label={t.tools.traceroute} onPress={() => run(() => NetScopeBridge.traceroute(host, 30))} />
        <GlassButton label={t.tools.dns} onPress={() => run(() => NetScopeBridge.dnsLookup(host))} />
      </View>
      <TextInput style={styles.input} placeholder="MAC, ví dụ AA:BB:CC:DD:EE:FF" placeholderTextColor={colors.textFaint} value={mac} onChangeText={setMac} autoCapitalize="characters" />
      <GlassButton label={t.tools.wol} onPress={() => run(() => NetScopeBridge.wakeOnLan(mac, '255.255.255.255'))} />
      {busy ? <Text style={styles.status}>Đang chạy...</Text> : null}
      {result ? (
        <GlassCard>
          <Text style={styles.result}>{result}</Text>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  input: { backgroundColor: colors.glassFill, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, color: colors.text, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  status: { color: colors.textMuted, fontSize: 14 },
  result: { color: colors.text, fontSize: 13, fontFamily: 'monospace' },
});
