import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';

export function registerRequestId(app: FastifyInstance){
    app.addHook('onRequest', async (req, _rep) => {
        req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    });
}