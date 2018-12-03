'use strict';

const Prometheus = require('prom-client');
require('pkginfo')(module, ['name']);
const debug = require('debug')(module.exports.name);
const utils = require('./utils');
const setupOptions = {};

module.exports = (appVersion, projectName) => {
    return (options = {}) => {
        const { metricsPath, defaultMetricsInterval = 10000, durationBuckets, requestSizeBuckets, responseSizeBuckets, useUniqueHistogramName, metricsPrefix, excludeRoutes } = options;
        debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);
        setupOptions.metricsRoute = metricsPath || '/metrics';
        setupOptions.excludeRoutes = excludeRoutes || [];

        let metricNames = {
            http_request_duration_seconds: 'http_request_duration_seconds',
            app_version: 'app_version',
            http_request_size_bytes: 'http_request_size_bytes',
            http_response_size_bytes: 'http_response_size_bytes',
            defaultMetricsPrefix: ''
        };
        metricNames = utils.getMetricNames(metricNames, useUniqueHistogramName, metricsPrefix, projectName);

        Prometheus.collectDefaultMetrics({ timeout: defaultMetricsInterval, prefix: `${metricNames.defaultMetricsPrefix}` });

        if (!Prometheus.register.getSingleMetric(metricNames.app_version)) {
            const version = new Prometheus.Gauge({
                name: metricNames.app_version,
                help: 'The service version by package.json',
                labelNames: ['version', 'major', 'minor', 'patch']
            });

            const versionSegments = appVersion.split('.').map(Number);
            version.labels(appVersion, versionSegments[0], versionSegments[1], versionSegments[2]).set(1);
        }

        setupOptions.responseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_duration_seconds) || new Prometheus.Histogram({
            name: metricNames.http_request_duration_seconds,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'code'],
            // buckets for response time from 1ms to 500ms
            buckets: durationBuckets || [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]
        });

        setupOptions.requestSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes) || new Prometheus.Histogram({
            name: metricNames.http_request_size_bytes,
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: requestSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] // buckets for response time from 5 bytes to 10000 bytes
        });

        setupOptions.responseSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes) || new Prometheus.Histogram({
            name: metricNames.http_response_size_bytes,
            help: 'Size of HTTP response in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: responseSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] // buckets for response time from 5 bytes to 10000 bytes
        });

        return middleware;
    };
};

function middleware (req, res, next) {
    if (req.url === setupOptions.metricsRoute) {
        debug('Request to /metrics endpoint');
        res.set('Content-Type', Prometheus.register.contentType);
        return res.end(Prometheus.register.metrics());
    }
    if (req.url === `${setupOptions.metricsRoute}.json`) {
        debug('Request to /metrics endpoint');
        return res.json(Prometheus.register.getMetricsAsJSON());
    }

    req.metrics = {
        timer: setupOptions.responseTimeHistogram.startTimer({method: req.method}),
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
    const responseLength = parseInt(res.get('Content-Length')) || 0;

    const route = _getRoute(req);

    if (route && utils.shouldLogMetrics(setupOptions.excludeRoutes, route)) {
        setupOptions.requestSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, req.metrics.contentLength);
        req.metrics.timer({ route: route, code: res.statusCode });
        setupOptions.responseSizeHistogram.observe({ method: req.method, route: route, code: res.statusCode }, responseLength);
        debug(`metrics updated, request length: ${req.metrics.contentLength}, response length: ${responseLength}`);
    }
}

function _getRoute(req) {
    let route = req.baseUrl; // express
    if (req.swagger) { // swagger
        route = req.swagger.apiPath;
    } else if (req.route) { // express
        if (req.route.path !== '/') {
            route = route + req.route.path;
        }

        if (route === '') {
            route = req.originalUrl.split('?')[0];
        } else {
            const splittedRoute = route.split('/');
            const splittedUrl = req.originalUrl.split('/');
            const routeIndex = splittedUrl.length - splittedRoute.length + 1;

            const baseUrl = splittedUrl.slice(0, routeIndex).join('/');
            route = baseUrl + route;
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