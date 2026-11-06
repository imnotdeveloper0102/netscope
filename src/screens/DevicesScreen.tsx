import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { DeviceRow } from '../components/DeviceRow';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassView';
import { useScanStore } from '../store/useScanStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getStrings } from '../i18n';
import { colors, spacing } from '../theme/tokens';
import { sortByIp } from '../utils/subnet';

type Filter = 'all' | 'new' | 'trusted' | 'openPorts';

export function DevicesScreen() {
  const navigation = useNavigation<any>();
  const devices = useScanStore((s) => s.devices);
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<'ip' | 'name' | 'latency'>('ip');

  const filtered = useMemo(() => {
    let list = devices;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((d) => d.ip.includes(q) || (d.hostname ?? '').toLowerCase().includes(q) || (d.customName ?? '').toLowerCase().includes(q));
    }
    if (filter === 'new') list = list.filter((d) => d.isNew);
    if (filter === 'trusted') list = list.filter((d) => d.trusted);
    if (filter === 'openPorts') list = list.filter((d) => d.openPorts.length > 0);
    const sorted = [...list];
    if (sortBy === 'ip') sorted.sort((a, b) => sortByIp(a.ip, b.ip));
    if (sortBy === 'name') sorted.sort((a, b) => (a.hostname ?? a.ip).localeCompare(b.hostname ?? b.ip));
    if (sortBy === 'latency') sorted.sort((a, b) => (a.latencyMs ?? 99999) - (b.latencyMs ?? 99999));
    return sorted;
  }, [devices, query, filter, sortBy]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.devices.title} ({filtered.length})</Text>
      <TextInput
        style={styles.input}
        placeholder={t.devices.search}
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.filters}>
        <GlassButton label={t.devices.filterAll} onPress={() => setFilter('all')} primary={filter === 'all'} />
        <GlassButton label={t.devices.filterNew} onPress={() => setFilter('new')} primary={filter === 'new'} />
        <GlassButton label={t.devices.filterTrusted} onPress={() => setFilter('trusted')} primary={filter === 'trusted'} />
      </View>
      <View style={styles.filters}>
        <GlassButton label="IP" onPress={() => setSortBy('ip')} primary={sortBy === 'ip'} />
        <GlassButton label="Tên" onPress={() => setSortBy('name')} primary={sortBy === 'name'} />
        <GlassButton label="Độ trễ" onPress={() => setSortBy('latency')} primary={sortBy === 'latency'} />
      </View>
      {filtered.length === 0 ? (
        <EmptyState message={t.devices.empty} />
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.ip}
          renderItem={({ item }) => (
            <DeviceRow device={item} onPress={(device) => navigation.navigate('DeviceDetail', { device })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: colors.glassFill, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, color: colors.text, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
});
