'use strict';

const Prometheus = require('prom-client');
require('pkginfo')(module, 'version', 'name');
const debug = require('debug')(module.exports.name);
const appVersion = module.exports.version;
let metricsInterval, path;

module.exports = (options = {}) => {
    const { metricsPath, defaultMetricsInterval, durationBuckets, requestSizeBuckets, responseSizeBuckets } = options;
    debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);
    metricsInterval = Prometheus.collectDefaultMetrics(defaultMetricsInterval);

    path = metricsPath || '/metrics';

    const version = new Prometheus.Gauge({
        name: 'app_version',
        help: 'The service version by package.json',
        labelNames: ['version', 'major', 'minor', 'patch']
    });

    const versionSegments = appVersion.split('.').map(Number);
    version.labels(appVersion, versionSegments[0], versionSegments[1], versionSegments[2]).set(1);

    new Prometheus.Histogram({
        name: 'http_request_duration_ms',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        // buckets for response time from 0.1ms to 500ms
        buckets: durationBuckets || [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
    });

    new Prometheus.Histogram({
        name: 'http_request_size_bytes',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        buckets: requestSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    });

    new Prometheus.Histogram({
        name: 'http_response_size_bytes',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        buckets: responseSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    });

    process.on('exit', _clearDefaultMetricsInternal);

    return middleware;
};

function middleware (req, res, next) {
    if (req.url === path) {
        debug('Request to /metrics endpoint');
        res.set('Content-Type', Prometheus.register.contentType);
        return res.end(Prometheus.register.metrics());
    }
    if (req.url === `${path}.json`) {
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

    Prometheus.register.getSingleMetric('http_request_size_bytes').observe({ method: req.method, route: req.route.path, code: res.statusCode }, req.metrics.contentLength);
    Prometheus.register.getSingleMetric('http_request_duration_ms').observe({ method: req.method, route: req.route.path, code: res.statusCode }, responseTime);
    Prometheus.register.getSingleMetric('http_response_size_bytes').observe({ method: req.method, route: req.route.path, code: res.statusCode }, responseLength);

    debug(`metrics updated, request length: ${req.metrics.contentLength}, response length: ${responseLength}, response time: ${responseTime}`);
}

function _clearDefaultMetricsInternal() {
    debug('Process is closing, stop the process metrics collection interval');
    clearInterval(metricsInterval);
}