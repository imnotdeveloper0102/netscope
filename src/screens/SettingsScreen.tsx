import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { NetScopeBridge } from '../services/bridge/NetScopeBridge';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';

export function SettingsScreen() {
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const strangerCheckEnabled = useSettingsStore((s) => s.strangerCheckEnabled);
  const setStrangerCheckEnabled = useSettingsStore((s) => s.setStrangerCheckEnabled);
  const scanTimeoutMs = useSettingsStore((s) => s.scanTimeoutMs);
  const setScanTimeoutMs = useSettingsStore((s) => s.setScanTimeoutMs);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const toggleStranger = async (enabled: boolean) => {
    setStrangerCheckEnabled(enabled);
    try {
      await NetScopeBridge.setStrangerCheckEnabled(enabled);
    } catch {
      setStrangerCheckEnabled(!enabled);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.settings.title}</Text>
      <GlassCard>
        <Text style={styles.warningTitle}>{t.warning.title}</Text>
        <Text style={styles.warningBody}>{t.warning.body}</Text>
      </GlassCard>
      <GlassCard>
        <View style={styles.row}>
          <Text style={styles.label}>{t.settings.strangerCheck}</Text>
          <Switch value={strangerCheckEnabled} onValueChange={toggleStranger} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.settings.timeout}</Text>
          <Text style={styles.value}>{scanTimeoutMs} ms</Text>
        </View>
        <View style={styles.row}>
          <GlassButton label="500 ms" onPress={() => setScanTimeoutMs(500)} primary={scanTimeoutMs === 500} />
          <GlassButton label="1000 ms" onPress={() => setScanTimeoutMs(1000)} primary={scanTimeoutMs === 1000} />
          <GlassButton label="2000 ms" onPress={() => setScanTimeoutMs(2000)} primary={scanTimeoutMs === 2000} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.settings.language}</Text>
          <GlassButton label="Tiếng Việt" onPress={() => setLanguage('vi')} primary={language === 'vi'} />
          <GlassButton label="English" onPress={() => setLanguage('en')} primary={language === 'en'} />
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  warningTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  warningBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 8, flexWrap: 'wrap' },
  label: { color: colors.text, fontSize: 15, flex: 1 },
  value: { color: colors.textMuted, fontSize: 14 },
});
