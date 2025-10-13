export function afterResponse(req, res, context, ee, next) {
    try {
        if (req && req.url && req.url.includes('/api/bookings/reserve')) {
            if (res.statusCode === 201) {
                ee.emit('counter', 'reserve_201');
            } else if (res.statusCode === 409) {
                ee.emit('counter', 'reserve_409');
            } else if (res.statusCode >= 500) {
                ee.emit('counter', 'reserve_5xx');
            } else if (res.statusCode >= 400) {
                ee.emit('counter', 'reserve_4xx_non409');
            }

            const err = context.vars.error;
            if (res.statusCode !== 201 && res.statusCode !== 409 && !context.vars._sampleLogged) {
                // eslint-disable-next-line no-console
                console.error('Non-201/409 sample:', res.statusCode, 'error:', err, 'body:', res.body?.toString?.());
                context.vars._sampleLogged = true;
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('processor error', e);
    }
    return next();
}
