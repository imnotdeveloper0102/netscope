import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassView';
import { ScanProgressBar } from '../components/ScanProgressBar';
import { Skeleton } from '../components/Skeleton';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import { useScan } from '../hooks/useScan';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';
import { formatDbm, formatFrequency } from '../utils/format';

export function OverviewScreen() {
  const navigation = useNavigation<any>();
  const { networkInfo, refreshNetworkInfo } = useNetworkInfo();
  const { scanning, scanned, total, startScan, cancelScan } = useScan();
  const language = useSettingsStore((s) => s.language);
  const firstRunWarningSeen = useSettingsStore((s) => s.firstRunWarningSeen);
  const setFirstRunWarningSeen = useSettingsStore((s) => s.setFirstRunWarningSeen);
  const t = getStrings(language);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  const row = (label: string, value: string | null | undefined) => (
    <View style={styles.row} key={label}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? t.overview.unavailable}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!firstRunWarningSeen ? (
        <GlassCard>
          <Text style={styles.warningTitle}>{t.warning.title}</Text>
          <Text style={styles.warningBody}>{t.warning.body}</Text>
          <GlassButton label={t.common.close} onPress={() => setFirstRunWarningSeen(true)} />
        </GlassCard>
      ) : null}
      <Text style={styles.title}>{t.overview.title}</Text>
      {networkInfo == null ? (
        <Skeleton />
      ) : (
        <GlassCard>
          {row(t.overview.ssid, networkInfo.ssid)}
          {networkInfo.ssid == null && networkInfo.ssidUnavailableReason ? (
            <Text style={styles.reason}>{networkInfo.ssidUnavailableReason}</Text>
          ) : null}
          {row(t.overview.bssid, networkInfo.bssid)}
          {row(t.overview.ip, networkInfo.ip)}
          {row(t.overview.subnet, networkInfo.subnetMask)}
          {row(t.overview.gateway, networkInfo.gateway)}
          {row(t.overview.dns, [networkInfo.dns1, networkInfo.dns2].filter(Boolean).join(', ') || null)}
          {row(t.overview.frequency, formatFrequency(networkInfo.frequencyMhz, networkInfo.channel))}
          {row(t.overview.linkSpeed, networkInfo.linkSpeedMbps ? `${networkInfo.linkSpeedMbps} Mbps` : null)}
          {row(t.overview.signal, formatDbm(networkInfo.rssiDbm))}
        </GlassCard>
      )}
      <ScanProgressBar scanned={scanned} total={total} scanning={scanning} onCancel={cancelScan} />
      <View style={styles.actions}>
        <GlassButton label={scanning ? t.overview.scanning : t.overview.scan} primary onPress={startScan} />
        <GlassButton label={t.settings.title} onPress={() => navigation.navigate('Settings')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 32, gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  warningTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  warningBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: colors.textMuted, fontSize: 14 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  reason: { color: colors.warning, fontSize: 12, marginBottom: 6 },
  actions: { gap: 12 },
});
