'use strict';

const Prometheus = require('prom-client');
require('pkginfo')(module, ['name']);
const debug = require('debug')(module.exports.name);
const utils = require('./utils');
const ExpressMiddleware = require('./express-middleware');
const KoaMiddleware = require('./koa-middleware');
const setupOptions = {};

module.exports = (appVersion, projectName, framework = 'express') => {
    return (options = {}) => {
        const { metricsPath, defaultMetricsInterval = 10000, durationBuckets, requestSizeBuckets, responseSizeBuckets, useUniqueHistogramName, metricsPrefix, excludeRoutes, includeQueryParams } = options;
        debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);
        setupOptions.metricsRoute = metricsPath || '/metrics';
        setupOptions.excludeRoutes = excludeRoutes || [];
        setupOptions.includeQueryParams = includeQueryParams;
        setupOptions.defaultMetricsInterval = defaultMetricsInterval;

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

        return frameworkMiddleware(framework);
    };
};

function frameworkMiddleware (framework) {
    switch (framework) {
    case 'koa':
        const middleware = new KoaMiddleware(setupOptions);
        return middleware.middleware.bind(middleware);
    default: {
        const middleware = new ExpressMiddleware(setupOptions);
        return middleware.middleware.bind(middleware);
    }
    }
}
