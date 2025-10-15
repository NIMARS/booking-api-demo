// endpoint /api/v1/statistics/  7/14/30 days (7 by default)
import type { FastifyInstance } from "fastify";
import { getStatistics } from "../statisitcs/statistics.js";

export async function registerStatisticsRoute(app: FastifyInstance) {
    app.get(
        "/api/statistics/:period",
        {
            schema: {
                params: {
                    type: "object",
                    required: ["period"],
                    properties: { period: { type: "integer", minimum: 1, maximum: 31 } },
                },
                querystring: {
                    type: "object",
                    properties: {
                        route: { type: "string" },
                        method: {
                            type: "string",
                            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
                        },
                        statusClass: { type: "string", enum: ["2xx", "4xx", "5xx"] },
                    },
                    additionalProperties: false,

                },
                // {
                //     "timestamp": 1760550782421,
                //     "method": "GET",
                //     "url": "/api/statistics/3",
                //     "status": 200,
                //     "req": null, // или ""
                //     "res": {
                //         "period": 3,
                //         "count": 0,
                //         "infoBody": []
                //     }
                // },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            period: { type: 'integer' },
                            count: { type: 'integer' },
                            infoBody: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        timestamp: { type: "number" },
                                        method: { type: "string" },
                                        url: { type: "string" },
                                        status: { type: "number" },
                                        req: {},
                                        res: {}
                                    }
                                }
                            }
                        }
                    }
                }
            },
        },
        async (req, rep) => {
            const raw = (req.params as any)?.period;
            let daysOfStat = Number(raw) || 7;
            const info = getStatistics(daysOfStat);
            return rep.send({
                period: daysOfStat,
                count: info.length,
                infoBody: info,
            });
        }
    );
}
