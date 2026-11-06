import { parseHttpServer, shortBanner } from '../src/utils/banner';

describe('banner utils', () => {
  test('parseHttpServer finds Server header', () => {
    expect(parseHttpServer('HTTP/1.1 200 OK\nServer: nginx/1.24.0\n')).toBe('nginx/1.24.0');
  });

  test('parseHttpServer returns null when missing', () => {
    expect(parseHttpServer('HTTP/1.1 200 OK\nContent-Type: text/html\n')).toBeNull();
  });

  test('shortBanner trims and caps at 200 chars', () => {
    expect(shortBanner('  SSH-2.0-OpenSSH_9.2  ')).toBe('SSH-2.0-OpenSSH_9.2');
    expect(shortBanner(null)).toBeNull();
    expect(shortBanner('x'.repeat(300))?.length).toBe(200);
  });
});
