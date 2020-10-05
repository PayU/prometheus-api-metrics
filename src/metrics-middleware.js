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
        const {
            metricsPath,
            defaultMetricsInterval = 10000,
            durationBuckets,
            requestSizeBuckets,
            responseSizeBuckets,
            useUniqueHistogramName,
            metricsPrefix,
            excludeRoutes,
            includeQueryParams,
            metricAdditionalLabels = [],
            getMetricsAdditionalLabelValues
        } = options;
        debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);

        setupOptions.metricsRoute = utils.validateInput({
            input: metricsPath,
            isValidInputFn: utils.isString,
            defaultValue: '/metrics',
            errorMessage: 'metricsPath should be an string'
        });

        setupOptions.excludeRoutes = utils.validateInput({
            input: excludeRoutes,
            isValidInputFn: utils.isArray,
            defaultValue: [],
            errorMessage: 'excludeRoutes should be an array'
        });

        setupOptions.includeQueryParams = includeQueryParams;
        setupOptions.defaultMetricsInterval = defaultMetricsInterval;

        setupOptions.metricAdditionalLabels = utils.validateInput({
            input: metricAdditionalLabels,
            isValidInputFn: utils.isArray,
            defaultValue: [],
            errorMessage: 'metricAdditionalLabels should be an array'
        });

        setupOptions.getMetricsAdditionalLabelValues = utils.validateInput({
            input: getMetricsAdditionalLabelValues,
            isValidInputFn: utils.isFunction,
            defaultValue: () => ({}),
            errorMessage: 'getMetricsAdditionalLabelValues should be a function'
        });

        const metricNames = utils.getMetricNames(
            {
                http_request_duration_seconds: 'http_request_duration_seconds',
                app_version: 'app_version',
                http_request_size_bytes: 'http_request_size_bytes',
                http_response_size_bytes: 'http_response_size_bytes',
                defaultMetricsPrefix: ''
            },
            useUniqueHistogramName,
            metricsPrefix,
            projectName
        );

        Prometheus.collectDefaultMetrics({ timeout: defaultMetricsInterval, prefix: `${metricNames.defaultMetricsPrefix}` });

        PrometheusRegisterAppVersion(appVersion, metricNames.app_version);

        const metricLabels = [
            'method',
            'route',
            'code',
            ...metricAdditionalLabels
        ].filter(Boolean);

        const defaultSizeBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

        setupOptions.responseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_duration_seconds) || new Prometheus.Histogram({
            name: metricNames.http_request_duration_seconds,
            help: 'Duration of HTTP requests in seconds',
            labelNames: metricLabels,
            // buckets for response time from 1ms to 500ms
            buckets: durationBuckets || [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]
        });

        setupOptions.requestSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes) || new Prometheus.Histogram({
            name: metricNames.http_request_size_bytes,
            help: 'Size of HTTP requests in bytes',
            labelNames: metricLabels,
            buckets: requestSizeBuckets || defaultSizeBuckets // buckets for request size from 5 bytes to 10000 bytes
        });

        setupOptions.responseSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes) || new Prometheus.Histogram({
            name: metricNames.http_response_size_bytes,
            help: 'Size of HTTP response in bytes',
            labelNames: metricLabels,
            buckets: responseSizeBuckets || defaultSizeBuckets // buckets for response size from 5 bytes to 10000 bytes
        });

        return frameworkMiddleware(framework);
    };
};

function PrometheusRegisterAppVersion(appVersion, metricName) {
    const version = new Prometheus.Gauge({
        name: metricName,
        help: 'The service version by package.json',
        labelNames: ['version', 'major', 'minor', 'patch']
    });

    const [major, minor, patch] = appVersion.split('.').map(Number);
    version.labels(appVersion, major, minor, patch).set(1);
}

function frameworkMiddleware (framework) {
    switch (framework) {
    case 'koa': {
        const middleware = new KoaMiddleware(setupOptions);
        return middleware.middleware.bind(middleware);
    }
    default: {
        const middleware = new ExpressMiddleware(setupOptions);
        return middleware.middleware.bind(middleware);
    }
    }
}
