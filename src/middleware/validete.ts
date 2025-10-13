import type { ZodType } from 'zod';
import type { FastifyRequest } from "fastify";

export function zodValidator<TOut, TIn>(schema: ZodType<TOut, TIn>) {
    return async (req: FastifyRequest): Promise<TOut> =>
        schema.parse((req as any).body ?? (req as any).query ?? (req as any).params);
}