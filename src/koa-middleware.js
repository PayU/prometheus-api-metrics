const Prometheus = require('prom-client');
require('pkginfo')(module, ['name']);
const debug = require('debug')(module.exports.name);
const utils = require('./utils');

const WILDCARD_ROUTE_ENDING = '(.*)';

class KoaMiddleware {
    constructor(setupOptions) {
        this.setupOptions = setupOptions;
    }

    _collectDefaultServerMetrics(timeout) {
        const NUMBER_OF_CONNECTIONS_METRICS_NAME = 'koajs_number_of_open_connections';
        this.setupOptions.numberOfConnectionsGauge = Prometheus.register.getSingleMetric(NUMBER_OF_CONNECTIONS_METRICS_NAME) || new Prometheus.Gauge({
            name: NUMBER_OF_CONNECTIONS_METRICS_NAME,
            help: 'Number of open connections to the Koa.js server'
        });
        if (this.setupOptions.server) {
            setInterval(this._getConnections.bind(this), timeout).unref();
        }
    }

    _getConnections() {
        if (this.setupOptions.server) {
            this.setupOptions.server.getConnections((error, count) => {
                if (error) {
                    debug('Error while collection number of open connections', error);
                } else {
                    this.setupOptions.numberOfConnectionsGauge.set(count);
                }
            });
        }
    }

    _handleResponse(ctx) {
        const responseLength = parseInt(ctx.response.get('Content-Length')) || 0;

        const route = this._getRoute(ctx) || 'N/A';

        if (route && utils.shouldLogMetrics(this.setupOptions.excludeRoutes, route)) {
            const labels = {
                method: ctx.req.method,
                route,
                code: ctx.res.statusCode,
                ...this.setupOptions.extractAdditionalLabelValuesFn(ctx)
            };
            this.setupOptions.requestSizeHistogram.observe(labels, ctx.req.metrics.contentLength);
            ctx.req.metrics.timer(labels);
            this.setupOptions.responseSizeHistogram.observe(labels, responseLength);
            debug(`metrics updated, request length: ${ctx.req.metrics.contentLength}, response length: ${responseLength}`);
        }
    }

    _getRoute(ctx) {
        let route;
        if (ctx._matchedRoute && !ctx._matchedRoute.endsWith(WILDCARD_ROUTE_ENDING)) {
            route = ctx._matchedRoute;
            route = route.endsWith('/') ? route.substring(0, route.length - 1) : route;
        } else if (ctx._matchedRoute) {
            route = this._handleSubRoutes(ctx._matchedRoute, ctx.originalUrl, ctx.request.method, ctx.router);
        }

        if (this.setupOptions.includeQueryParams === true && Object.keys(ctx.query).length > 0) {
            route = `${route || '/'}?${Object.keys(ctx.query).sort().map((queryParam) => `${queryParam}=<?>`).join('&')}`;
        }

        return route;
    }

    _handleSubRoutes(matchedRoute, originalUrl, method, router) {
        let route;
        const routeStart = matchedRoute.substring(0, matchedRoute.length - WILDCARD_ROUTE_ENDING.length);
        let url = this._removeQueryFromUrl(originalUrl).substring(routeStart.length);
        let matchedRoutes = router.match(url, method);
        if (matchedRoutes.path.length > 0) {
            route = this._findFirstProperRoute(matchedRoutes.path);
            return routeStart + route;
        } else {
            url = this._removeQueryFromUrl(originalUrl);
            matchedRoutes = router.match(url, method);
            if (matchedRoutes.path.length > 0) {
                route = this._findFirstProperRoute(matchedRoutes.path);
                return route;
            }
        }
    }

    _findFirstProperRoute(routes) {
        const properRoute = routes.find(route => {
            if (!route.path.endsWith('(.*)')) {
                return route;
            }
        });

        // If proper route is not found, send an undefined route
        // The caller is responsible for setting a default "N/A" route in this case
        if (!properRoute) {
            return undefined;
        }

        let route = properRoute.path;
        route = route.endsWith('/') ? route.substring(0, route.length - 1) : route;
        return route;
    }

    _removeQueryFromUrl(url) {
        return url.split('?')[0];
    }

    async middleware(ctx, next) {
        if (!this.setupOptions.server && ctx.req.socket) {
            this.setupOptions.server = ctx.req.socket.server;
            this._collectDefaultServerMetrics(this.setupOptions.defaultMetricsInterval);
        }
        if (ctx.req.url === this.setupOptions.metricsRoute) {
            debug('Request to /metrics endpoint');
            ctx.set('Content-Type', Prometheus.register.contentType);
            ctx.body = await Prometheus.register.metrics();
            return next();
        }
        if (ctx.req.url === `${this.setupOptions.metricsRoute}.json`) {
            debug('Request to /metrics endpoint');
            ctx.body = await Prometheus.register.getMetricsAsJSON();
            return next();
        }

        ctx.req.metrics = {
            timer: this.setupOptions.responseTimeHistogram.startTimer(),
            contentLength: parseInt(ctx.request.get('content-length')) || 0
        };

        debug(`Set start time and content length for request. url: ${ctx.req.url}, method: ${ctx.req.method}`);

        ctx.res.once('finish', () => {
            debug('on finish.');
            this._handleResponse(ctx);
        });

        return next();
    };
}

module.exports = KoaMiddleware;
