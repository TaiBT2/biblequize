// Centralized frontend configuration for API and WebSocket bases

export function isDebug(): boolean {
  // __DEBUG__ is defined in vite.config.ts; fallback to NODE_ENV
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - __DEBUG__ is injected by Vite define
  return typeof __DEBUG__ !== 'undefined' ? Boolean(__DEBUG__) : (import.meta.env.MODE !== 'production');
}

export function getApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envValue && envValue.trim().length > 0) return envValue;

  // The Capacitor app has no same-origin backend — an empty base would
  // silently resolve to `https://localhost` (the WebView origin) and every
  // API call would 404. Fail loud at build/runtime instead.
  if (import.meta.env.VITE_TARGET === 'capacitor') {
    throw new Error(
      '[config] VITE_API_BASE_URL must be an absolute URL for capacitor builds.'
    );
  }

  // Default to empty string to allow Vite proxy to add /api prefix
  return '';
}

export function getWsBaseUrl(): string {
  const envWs = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  if (envWs && envWs.trim().length > 0) return envWs;

  const api = getApiBaseUrl();
  try {
    // If api is absolute, derive ws(s) from it
    if (api.startsWith('http://') || api.startsWith('https://')) {
      const url = new URL(api);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/';
      url.search = '';
      url.hash = '';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // ignore
  }

  // Same-origin ws(s) base
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

export function resolveWsUrl(pathOrAbsolute: string): string {
  if (pathOrAbsolute.startsWith('ws://') || pathOrAbsolute.startsWith('wss://')) {
    return pathOrAbsolute;
  }
  const base = getWsBaseUrl();
  if (pathOrAbsolute.startsWith('/')) {
    return `${base}${pathOrAbsolute}`;
  }
  return `${base}/${pathOrAbsolute}`;
}


