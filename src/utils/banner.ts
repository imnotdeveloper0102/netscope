export function parseHttpServer(headers: string): string | null {
  for (const line of headers.split('\n')) {
    if (line.toLowerCase().startsWith('server:')) {
      const value = line.slice('server:'.length).trim();
      if (value) return value;
    }
  }
  return null;
}

export function shortBanner(banner: string | null | undefined): string | null {
  if (!banner) return null;
  return banner.trim().slice(0, 200) || null;
}
