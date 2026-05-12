/**
 * Public entry for in-app performance metrics (ring buffer + Web Vitals wiring).
 *
 * Prefer importing from `@/app/lib/performance` so production export (Sentry,
 * `/api/analytics`, etc.) can be centralized in `recordMetric` without touching
 * every caller (see GUIDE 4.5).
 */
export * from '../performanceAnalyzer';
export { subscribeWebVitalsForPath } from './subscribeWebVitals';
