import Fastify from 'fastify';
import { registerRoutes } from './routes/routes.js';
import { registerErrorHandler } from './middleware/errors.js';
import { registerRequestId } from './middleware/requestId.js';
import { registerIdempotency } from './middleware/idempotence.js';
import { registerStatisticsRoute } from './api/statisitcs.controller.js';
import { registerStatWriter } from './middleware/statwriter.js';


export function buildApp(){
    const app = Fastify({logger: true});
    registerStatWriter(app);
    registerStatisticsRoute(app);
    registerRequestId(app);
    registerIdempotency(app);
    registerErrorHandler(app);
    registerRoutes(app);
    return app;
}