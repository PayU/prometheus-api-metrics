const Prometheus = require('prom-client');
require('pkginfo')(module, ['name']);
const debug = require('debug')(module.exports.name);
const utils = require('./utils');

class ExpressMiddleware {
    constructor(setupOptions) {
        this.setupOptions = setupOptions;
    }

    _collectDefaultServerMetrics(timeout) {
        const NUMBER_OF_CONNECTIONS_METRICS_NAME = 'expressjs_number_of_open_connections';
        this.setupOptions.numberOfConnectionsGauge = Prometheus.register.getSingleMetric(NUMBER_OF_CONNECTIONS_METRICS_NAME) || new Prometheus.Gauge({
            name: NUMBER_OF_CONNECTIONS_METRICS_NAME,
            help: 'Number of open connections to the Express.js server'
        });
        if (this.setupOptions.server) {
            setInterval(this._getConnections.bind(this), timeout).unref();
        }
    }

    _getConnections() {
        if (this.setupOptions && this.setupOptions.server) {
            this.setupOptions.server.getConnections((error, count) => {
                if (error) {
                    debug('Error while collection number of open connections', error);
                } else {
                    this.setupOptions.numberOfConnectionsGauge.set(count);
                }
            });
        }
    }

    _handleResponse (req, res) {
        const responseLength = parseInt(res.get('Content-Length')) || 0;

        const route = this._getRoute(req);

        if (route && utils.shouldLogMetrics(this.setupOptions.excludeRoutes, route)) {
            this.setupOptions.requestSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, req.metrics.contentLength);
            req.metrics.timer({ route: route, code: res.statusCode });
            this.setupOptions.responseSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, responseLength);
            debug(`metrics updated, request length: ${req.metrics.contentLength}, response length: ${responseLength}`);
        }
    }

    _getRoute(req) {
        let route = req.baseUrl;
        if (req.route) {
            if (req.route.path !== '/') {
                route = route ? route + req.route.path : req.route.path;
            }

            if (!route || route === '' || typeof route !== 'string') {
                route = req.originalUrl.split('?')[0];
            } else {
                const splittedRoute = route.split('/');
                const splittedUrl = req.originalUrl.split('?')[0].split('/');
                const routeIndex = splittedUrl.length - splittedRoute.length + 1;

                const baseUrl = splittedUrl.slice(0, routeIndex).join('/');
                route = baseUrl + route;
            }

            if (this.setupOptions.includeQueryParams === true && Object.keys(req.query).length > 0) {
                route = `${route}?${Object.keys(req.query).sort().map((queryParam) => `${queryParam}=<?>`).join('&')}`;
            }
        }

        // nest.js - build request url pattern if exists
        if (typeof req.params === 'object') {
            Object.keys(req.params).forEach((paramName) => {
                route = route.replace(req.params[paramName], ':' + paramName);
            });
        }

        // this condition will evaluate to true only in
        // express framework and no route was found for the request. if we log this metrics
        // we'll risk in a memory leak since the route is not a pattern but a hardcoded string.
        if (!route || route === '') {
            // if (!req.route && res && res.statusCode === 404) {
            route = 'N/A';
        }

        return route;
    }

    middleware(req, res, next) {
        if (!this.setupOptions.server && req.socket) {
            this.setupOptions.server = req.socket.server;
            this._collectDefaultServerMetrics(this.setupOptions.defaultMetricsInterval);
        }

        const routeUrl = req.originalUrl || req.url;

        if (routeUrl === this.setupOptions.metricsRoute) {
            debug('Request to /metrics endpoint');
            res.set('Content-Type', Prometheus.register.contentType);
            return res.end(Prometheus.register.metrics());
        }
        if (routeUrl === `${this.setupOptions.metricsRoute}.json`) {
            debug('Request to /metrics endpoint');
            return res.json(Prometheus.register.getMetricsAsJSON());
        }

        req.metrics = {
            timer: this.setupOptions.responseTimeHistogram.startTimer({
                method: req.method
            }),
            contentLength: parseInt(req.get('content-length')) || 0
        };

        debug(`Set start time and content length for request. url: ${routeUrl}, method: ${req.method}`);

        res.once('finish', () => {
            debug('on finish.');
            this._handleResponse(req, res);
        });

        return next();
    };
}

module.exports = ExpressMiddleware;
