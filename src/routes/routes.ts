import type { FastifyInstance } from 'fastify';
import { registerBookingRoutes } from '../api/booking.controller.js';
import { registerEventsRoutes } from '../api/events.controller.js';
import { query } from '../db/index.js';

export async function registerRoutes(app: FastifyInstance) {
    app.get('/health', async () => ({status: 'ok'}));
    app.get('/ready',  async (req, rep) => {
        try {
            return { status: 'ready' };
          } catch (e) {
            req.log.error({ err: e }, 'db_not_ready');
            return rep.code(503).send({ status: 'not_ready', reason: 'db' });
          }
    });
    
    await registerBookingRoutes(app);
    await registerEventsRoutes(app);
}