import type { FastifyInstance } from 'fastify';
import { writeLogInfo } from '../statisitcs/statistics.js';

// loginfo == timestamp, method, url, status, req, res

function parser(payload: any): unknown{
    if(!payload)
        return payload;
    if(typeof payload === 'string'){
        try {
            return JSON.parse(payload);
        } catch (error) {
            console.log("payload parse error", error);
            return payload;
        }
    }
}

export function registerStatWriter(app: FastifyInstance){
    app.addHook('onSend', async (req, rep, payload) => {
        writeLogInfo({
            timestamp: Date.now(),
            method:    req.method,
            url:       req.url,
            status:    rep.statusCode,
            req:       (req as any).body ?? null,
            res:       parser(payload),
        });
        return payload;
    })
}