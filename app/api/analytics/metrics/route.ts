import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';
import { MetricType } from '@/app/lib/performanceAnalyzer';

const NAME_TO_TYPE: Record<string, MetricType> = {
  CLS: MetricType.LAYOUT_SHIFT,
  FID: MetricType.FIRST_INPUT,
  LCP: MetricType.PAINT,
  INP: MetricType.INTERACTION,
  TTFB: MetricType.RESOURCE,
};

const bodySchema = z
  .object({
    type: z.nativeEnum(MetricType),
    name: z.enum(['CLS', 'FID', 'LCP', 'INP', 'TTFB']),
    value: z.number().finite().nonnegative(),
    ts: z.number().optional(),
    pathname: z.string().max(512).optional(),
  })
  .strict()
  .refine((data) => NAME_TO_TYPE[data.name] === data.type, {
    message: 'type does not match web-vital name',
  });

async function postHandler(req: NextRequest): Promise<Response> {
  return withApiErrorHandling(req, async () => {
    const raw: unknown = await req.json();
    bodySchema.parse(raw);

    if (process.env.NODE_ENV === 'development') {
      console.log('[api/analytics/metrics]', raw);
    }

    return { ok: true as const };
  });
}

export const POST = withRateLimit(postHandler, RateLimitConfigs.public);
