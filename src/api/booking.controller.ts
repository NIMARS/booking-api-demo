import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { withT } from "../db/index.js";
import { reserveSeat } from "../services/booking.service.js";

const ReserveBody = z.object({
  event_id: z.number().int().positive(),
  user_id: z.string().min(1),
});

export async function registerBookingRoutes(app: FastifyInstance) {
  app.post(
    "/api/bookings/reserve",
    {
      schema: {
        body: {
          type: "object",
          required: ["event_id", "user_id"],
          additionalProperties: false,
          properties: {
            event_id: { type: "integer", minimum: 1 },
            user_id: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (req, rep) => {
      const body = ReserveBody.parse((req as any).body);
      const result = await withT((count) =>
        reserveSeat(count, body.event_id, body.user_id)
      );
      rep.code(201).send(result);
    }
  );
}
