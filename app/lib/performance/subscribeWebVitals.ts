/**
 * Centralized web-vitals subscriptions that feed `recordMetric`.
 * Used by app providers so we do not duplicate metric wiring.
 */
import { recordMetric, MetricType } from '../performanceAnalyzer';

export function subscribeWebVitalsForPath(pathname: string): void {
  if (typeof window === 'undefined') return;

  const meta = { pathname };

  import('web-vitals')
    .then(({ getCLS, getFID, getLCP, getINP, getTTFB }) => {
      getCLS((m) => {
        recordMetric({
          type: MetricType.LAYOUT_SHIFT,
          name: 'CLS',
          value: m.value,
          metadata: meta,
        });
      });

      getFID((m) => {
        recordMetric({
          type: MetricType.FIRST_INPUT,
          name: 'FID',
          value: m.value,
          metadata: meta,
        });
      });

      getLCP((m) => {
        recordMetric({
          type: MetricType.PAINT,
          name: 'LCP',
          value: m.value,
          metadata: meta,
        });
      });

      getINP((m) => {
        recordMetric({
          type: MetricType.INTERACTION,
          name: 'INP',
          value: m.value,
          metadata: meta,
        });
      });

      getTTFB((m) => {
        recordMetric({
          type: MetricType.RESOURCE,
          name: 'TTFB',
          value: m.value,
          metadata: meta,
        });
      });
    })
    .catch(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('web-vitals library not available');
      }
    });
}
