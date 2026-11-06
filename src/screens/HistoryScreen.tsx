import React, { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { EmptyState } from '../components/EmptyState';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { NetScopeBridge } from '../services/bridge/NetScopeBridge';
import { useScanStore } from '../store/useScanStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';
import { formatTime } from '../utils/format';

export function HistoryScreen() {
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const history = useScanStore((s) => s.history);
  const loadHistory = useScanStore((s) => s.loadHistory);
  const [compareResult, setCompareResult] = useState('');
  const [firstIndex, setFirstIndex] = useState(0);
  const [secondIndex, setSecondIndex] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const exportScan = async (index: number, format: 'csv' | 'json') => {
    try {
      const content = await NetScopeBridge.exportScan(index, format);
      const path = `${FileSystem.cacheDirectory}netscope-scan-${index}.${format}`;
      await FileSystem.writeAsStringAsync(path, content);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        await Share.share({ message: content });
      }
    } catch (e: any) {
      setCompareResult(e?.message ?? 'Xuất lỗi');
    }
  };

  const compare = async () => {
    try {
      const diff = await NetScopeBridge.compareScans(firstIndex, secondIndex);
      setCompareResult(`${t.history.newDevices}: ${diff.newDevices.map((d) => d.ip).join(', ') || 'không có'}\n${t.history.disappearedDevices}: ${diff.disappearedDevices.map((d) => d.ip).join(', ') || 'không có'}`);
    } catch (e: any) {
      setCompareResult(e?.message ?? 'So sánh lỗi');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.history.title}</Text>
      {history.length === 0 ? <EmptyState message={t.history.empty} /> : null}
      {history.map((record, index) => (
        <GlassCard key={record.id}>
          <Text style={styles.record}>{formatTime(record.timestamp)} • {record.subnet} • {record.deviceCount} thiết bị</Text>
          <View style={styles.row}>
            <GlassButton label={t.history.exportCsv} onPress={() => exportScan(index, 'csv')} />
            <GlassButton label={t.history.exportJson} onPress={() => exportScan(index, 'json')} />
          </View>
        </GlassCard>
      ))}
      {history.length >= 2 ? (
        <GlassCard>
          <Text style={styles.record}>{t.history.compare}</Text>
          <View style={styles.row}>
            <GlassButton label="0 vs 1" primary onPress={() => { setFirstIndex(0); setSecondIndex(1); compare(); }} />
          </View>
          {compareResult ? <Text style={styles.result}>{compareResult}</Text> : null}
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  record: { color: colors.text, fontSize: 14, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  result: { color: colors.textMuted, fontSize: 14, marginTop: 10 },
});
