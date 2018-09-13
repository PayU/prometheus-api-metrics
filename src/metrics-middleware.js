'use strict';

const Prometheus = require('prom-client');
require('pkginfo')(module, 'name', 'version');
const Path = require('path');
const debug = require('debug')(module.exports.name);
let metricsInterval, route, responseTimeHistogram, requestSizeHistogram, responseSizeHistogram, onExitEvent;

module.exports = (options = {}) => {
    require('pkginfo')(module, { dir: Path.dirname(module.parent.filename) }, 'version');
    const appVersion = module.exports.version;
    const { metricsPath, defaultMetricsInterval, durationBuckets, requestSizeBuckets, responseSizeBuckets } = options;
    debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);
    metricsInterval = Prometheus.collectDefaultMetrics(defaultMetricsInterval);

    route = metricsPath || '/metrics';

    if (!Prometheus.register.getSingleMetric('app_version')) {
        const version = new Prometheus.Gauge({
            name: 'app_version',
            help: 'The service version by package.json',
            labelNames: ['version', 'major', 'minor', 'patch']
        });

        const versionSegments = appVersion.split('.').map(Number);
        version.labels(appVersion, versionSegments[0], versionSegments[1], versionSegments[2]).set(1);
    }

    if (!Prometheus.register.getSingleMetric('http_request_duration_ms')) {
        responseTimeHistogram = new Prometheus.Histogram({
            name: 'http_request_duration_ms',
            help: 'Duration of HTTP requests in ms',
            labelNames: ['method', 'route', 'code'],
            // buckets for response time from 0.1ms to 500ms
            buckets: durationBuckets || [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
        });
    }

    if (!Prometheus.register.getSingleMetric('http_request_size_bytes')) {
        requestSizeHistogram = new Prometheus.Histogram({
            name: 'http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: requestSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
        });
    }

    if (!Prometheus.register.getSingleMetric('http_response_size_bytes')) {
        responseSizeHistogram = new Prometheus.Histogram({
            name: 'http_response_size_bytes',
            help: 'Size of HTTP response in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: responseSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
        });
    }

    if (!onExitEvent) {
        onExitEvent = process.on('exit', _clearDefaultMetricsInternal);
    }

    return middleware;
};

function middleware (req, res, next) {
    if (req.url === route) {
        debug('Request to /metrics endpoint');
        res.set('Content-Type', Prometheus.register.contentType);
        return res.end(Prometheus.register.metrics());
    }
    if (req.url === `${route}.json`) {
        debug('Request to /metrics endpoint');
        return res.json(Prometheus.register.getMetricsAsJSON());
    }

    req.metrics = {
        startEpoch: Date.now(),
        contentLength: parseInt(req.get('content-length')) || 0
    };
    debug(`Set start time and content length for request. url: ${req.url}, method: ${req.method}`);

    res.once('finish', () => {
        debug('on finish.');
        _handleResponse(req, res);
    });

    return next();
}

function _handleResponse (req, res) {
    const responseTime = Date.now() - req.metrics.startEpoch;
    const responseLength = parseInt(res.get('Content-Length')) || 0;

    const route = _getRoute(req);

    if (route) {
        requestSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, req.metrics.contentLength);
        responseTimeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, responseTime);
        responseSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, responseLength);

        debug(`metrics updated, request length: ${req.metrics.contentLength}, response length: ${responseLength}, response time: ${responseTime}`);
    }
}

function _getRoute(req) {
    let res = req.res;
    let route = req.baseUrl; // express
    if (req.swagger) { // swagger
        route = req.swagger.apiPath;
    } else if (req.route && route) { // express
        if (req.route.path !== '/') {
            route = route + req.route.path;
        }
    } else if (req.url && !route) { // restify
        route = req.url;
        if (req.route) {
            route = req.route.path;
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
    if (!req.route && res && res.statusCode === 404) {
        return undefined;
    }

    return route;
}

function _clearDefaultMetricsInternal() {
    debug('Process is closing, stop the process metrics collection interval');
    clearInterval(metricsInterval);
}