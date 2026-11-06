import { ipToLong, prefixToMask, sortByIp } from '../src/utils/subnet';

describe('subnet utils', () => {
  test('ipToLong converts 192.168.1.1', () => {
    expect(ipToLong('192.168.1.1')).toBe(3232235777);
  });

  test('ipToLong returns -1 for invalid', () => {
    expect(ipToLong('999.1.1.1')).toBe(-1);
    expect(ipToLong('not-an-ip')).toBe(-1);
  });

  test('prefixToMask /24', () => {
    expect(prefixToMask(24)).toBe('255.255.255.0');
  });

  test('sortByIp orders numerically', () => {
    const list = ['192.168.1.10', '192.168.1.2', '192.168.1.1'];
    expect([...list].sort(sortByIp)).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.10']);
  });
});
