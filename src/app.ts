import Fastify from 'fastify';
import { registerRoutes } from './routes/routes.js';
import { registerErrorHandler } from './middleware/errors.js';
import { registerRequestId } from './middleware/requestId.js';
import { registerIdempotency } from './middleware/idempotence.js';

export function buildApp(){
    const app = Fastify({logger: true});
    registerRequestId(app);
    registerIdempotency(app);
    registerErrorHandler(app);
    registerRoutes(app);
    return app;
}