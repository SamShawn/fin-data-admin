import { z } from 'zod';

export const createStrategySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const updateStrategySchema = createStrategySchema.partial();
