export function formatDbm(rssi: number | null | undefined): string {
  if (rssi == null) return 'Không khả dụng';
  return `${rssi} dBm`;
}

export function formatLatency(latencyMs: number | null | undefined): string {
  if (latencyMs == null) return 'Không khả dụng';
  return `${latencyMs} ms`;
}

export function formatFrequency(frequencyMhz: number | null | undefined, channel: number | null | undefined): string {
  if (frequencyMhz == null) return 'Không khả dụng';
  const band = frequencyMhz >= 5925 ? '6 GHz' : frequencyMhz >= 5000 ? '5 GHz' : '2.4 GHz';
  return channel ? `${frequencyMhz} MHz (kênh ${channel}, ${band})` : `${frequencyMhz} MHz (${band})`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('vi-VN');
}
