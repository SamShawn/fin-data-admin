import { z } from 'zod';

export const marketDataQuerySchema = z.object({
  stockCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  industry: z.string().optional(),
  minPctChange: z.coerce.number().optional(),
  maxPctChange: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(200),
  sort: z.string().optional(),
});

export type MarketDataQuery = z.infer<typeof marketDataQuerySchema>;
