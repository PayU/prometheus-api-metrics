const Prometheus = require('prom-client');
require('pkginfo')(module, ['name']);
const debug = require('debug')(module.exports.name);

module.exports = (setupOptions) => {
    return (ctx, next) => {
        // if (!setupOptions.server && req.socket) {
        //     setupOptions.server = req.socket.server;
        //     _collectDefaultServerMetrics(setupOptions.defaultMetricsInterval, setupOptions);
        // }
        if (ctx.req.url === setupOptions.metricsRoute) {
            debug('Request to /metrics endpoint');
            ctx.res.set('Content-Type', Prometheus.register.contentType);
            return ctx.res.end(Prometheus.register.metrics());
        }
        if (ctx.req.url === `${setupOptions.metricsRoute}.json`) {
            debug('Request to /metrics endpoint');
            return ctx.res.json(Prometheus.register.getMetricsAsJSON());
        }

        ctx.req.metrics = {
            timer: setupOptions.responseTimeHistogram.startTimer({
                method: ctx.req.method
            }),
            contentLength: parseInt(ctx.req.get('content-length')) || 0
        };

        debug(`Set start time and content length for request. url: ${ctx.req.url}, method: ${ctx.req.method}`);

        ctx.res.once('finish', () => {
            debug('on finish.');
            // _handleResponse(ctx.req, ctx.res);
        });

        return next();
    };
};