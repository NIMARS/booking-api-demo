import { ZodError } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../services/booking.service.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, _req, reply) => {
    const isFastifyValidation = (err as any)?.code === 'FST_ERR_VALIDATION' || Array.isArray((err as any)?.validation);

    if (isFastifyValidation) { // for JSON schema, like err of zoderror  :3
      const ajvErrors = (err as any).validation ?? (err as any).errors ?? [];
      const details = ajvErrors.map((e: any) => ({
        path: e.instancePath || e.dataPath || e.params?.missingProperty || '',
        message: e.message,
        keyword: e.keyword,
      }));
      return reply.status(422).send({ error: 'validation_error', details });
    }

    if (err instanceof ZodError) {
      return reply
        .status(422)
        .send({ error: "validation_error", details: err.flatten() });
    }

    if ((err as any)?.code === "23505") {
      return reply.status(409).send({ error: "already_booooked" });
    }

    const status = (err as any)?.status;
    const message = (err as any)?.message ?? 'error';

    if (typeof status === 'number' && status >= 400 && status < 600) {
        return reply.status(status).send({ error: message });
      }

    app.log.error({ err }, "unhandled_error");
    return reply.status(501).send({ error: "internal_error" });
  });
}
