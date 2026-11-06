export function ipToLong(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) return -1;
  let result = 0;
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isInteger(value) || value < 0 || value > 255) return -1;
    result = (result << 8) + value;
  }
  return result >>> 0;
}

export function prefixToMask(prefix: number): string {
  if (prefix <= 0) return '0.0.0.0';
  if (prefix >= 32) return '255.255.255.255';
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return `${(mask >>> 24) & 0xff}.${(mask >>> 16) & 0xff}.${(mask >>> 8) & 0xff}.${mask & 0xff}`;
}

export function sortByIp(a: string, b: string): number {
  return ipToLong(a) - ipToLong(b);
}
