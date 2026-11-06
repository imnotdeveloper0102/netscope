import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ChannelGraph } from '../components/ChannelGraph';
import { EmptyState } from '../components/EmptyState';
import { GlassCard } from '../components/GlassCard';
import { Skeleton } from '../components/Skeleton';
import { NetScopeBridge, type WifiScan } from '../services/bridge/NetScopeBridge';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';

export function WifiScreen() {
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const [scan, setScan] = useState<WifiScan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    NetScopeBridge.getWifiNetworks()
      .then(setScan)
      .catch((e: any) => setError(e?.message ?? 'Không quét được Wi-Fi'))
      .finally(() => setLoading(false));
  }, []);

  const networks24 = (scan?.networks ?? []).filter((n) => n.frequencyMhz < 5000);
  const networks5 = (scan?.networks ?? []).filter((n) => n.frequencyMhz >= 5000);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.wifi.title}</Text>
      {loading ? <Skeleton /> : null}
      {error ? <EmptyState message={error} /> : null}
      {scan?.throttled ? <EmptyState message={t.wifi.throttled} /> : null}
      {scan?.unavailableReason ? <EmptyState message={scan.unavailableReason} /> : null}
      {scan && !scan.throttled ? (
        <>
          <GlassCard>
            <Text style={styles.suggest}>{t.wifi.suggested24}: {scan.suggestedChannel24 ?? 'Không khả dụng'}</Text>
            <Text style={styles.suggest}>{t.wifi.suggested5}: {scan.suggestedChannel5 ?? 'Không khả dụng'}</Text>
          </GlassCard>
          <ChannelGraph networks={networks24} band="2.4" />
          <ChannelGraph networks={networks5} band="5" />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  suggest: { color: colors.text, fontSize: 14, paddingVertical: 4 },
});
