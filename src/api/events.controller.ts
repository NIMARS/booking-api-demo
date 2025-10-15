import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { withT } from "../db/index.js";
import { AppError } from "../services/booking.service.js";
import { getEventAvailiability } from "../services/events.service.js";

const Params = z.object({
  id: z.coerce.number().int().positive(),
});

export async function registerEventsRoutes(app: FastifyInstance) {
  app.get(
    "/api/events/:id/availiability",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: { id: { type: "integer", minimum: 1 } },
        },
      },
    },
    async (req, rep) => {
      const { id } = Params.parse(req.params);
      const data = await withT((count) => getEventAvailiability(count, id));
      if (!data) throw new AppError("event_not_found", 404);
      return rep.send(data);
    }
  );
}
