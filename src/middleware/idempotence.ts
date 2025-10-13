import type { FastifyInstance } from 'fastify';

const memory = new Map<string, {status: number, body: any}>(); // maybe transite that to mongo/pg or redis (longer)?

export function registerIdempotency(app: FastifyInstance) {
    const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

    app.addHook('preHandler', async (req, rep) => {
        if (!METHODS.has(req.method)) return; 

        const raw = req.headers['idempotency-key'];
        const key = Array.isArray(raw) ? raw[0] : raw;
        if (!key)
            return;

        const cached = memory.get(key);
        if(cached){
            return rep.code(cached.status).send(cached.body);
        }else{
            memory.set(key + ':lock', {status: 0, body: null}); //minimalistic key
        }
    });

    app.addHook('onSend', async (req, rep, payload) => {
        if (!METHODS.has(req.method)) return; 

        const raw = req.headers['idempotency-key'];
        const key = Array.isArray(raw) ? raw[0] : raw; 
        
        if(key && !memory.has(key)){
            memory.set(key, {status: rep.statusCode, body: tryParse(payload)});
            memory.delete(key + ':lock');
        }
        return payload;
    })

    function tryParse(to_parse: any){
        try {
            return typeof to_parse === 'string' ? JSON.parse(to_parse) : to_parse;
        } catch {
            return to_parse;
        }
    }
}