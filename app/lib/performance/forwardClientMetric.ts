import type { PerformanceMetric } from '../performanceAnalyzer';

const WEB_VITAL_NAMES = new Set(['CLS', 'FID', 'LCP', 'INP', 'TTFB']);

/**
 * Fire-and-forget ingest for Core Web Vitals only (low volume, no arbitrary metadata).
 * Server validates type/name pairs; disable with NEXT_PUBLIC_DISABLE_CLIENT_PERF_INGEST=true.
 */
export function maybeForwardClientMetric(metric: PerformanceMetric): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NEXT_PUBLIC_DISABLE_CLIENT_PERF_INGEST === 'true') return;
  if (!WEB_VITAL_NAMES.has(metric.name)) return;

  const pathnameRaw = metric.metadata?.pathname;
  const pathname =
    typeof pathnameRaw === 'string' ? pathnameRaw.slice(0, 512) : undefined;

  const payload = JSON.stringify({
    type: metric.type,
    name: metric.name,
    value: metric.value,
    ts: metric.timestamp,
    pathname,
  });

  const url = '/api/analytics/metrics';

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    // ignore — metrics must never break UX
  }
}
