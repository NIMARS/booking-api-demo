// endpoint /api/v1/statistics/  7/14/30 days (7 by default)
import type { FastifyInstance } from "fastify";
import { getStatistics } from "../statisitcs/statistics.js";

export async function registerStatisticsRoute(app: FastifyInstance) {
  app.get("/api/stitstics/:period", async (req, rep) => {
    const raw = (req.params as any)?.period;
    let daysOfStat = Number(raw);
    if (daysOfStat <= 0 || daysOfStat > 31) daysOfStat = 7;
    const info = getStatistics(daysOfStat);
    return rep.send({ period: daysOfStat, count: info.length, infoBody: info });
  });
}
