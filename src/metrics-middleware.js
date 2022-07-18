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
            httpMetricsPrefix,
            excludeRoutes,
            includeQueryParams,
            additionalLabels = [],
            extractAdditionalLabelValuesFn,
            excludeDefaultMetricLabels,
            useCountersForRequestSizeMetric,
            useCountersForResponseSizeMetric
        } = options;
        debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);

        utils.validateInput({
            input: metricsPrefix,
            isValidInputFn: utils.isString,
            errorMessage: 'metricsPrefix should be an string'
        });

        utils.validateInput({
            input: httpMetricsPrefix,
            isValidInputFn: utils.isString,
            errorMessage: 'httpMetricsPrefix should be an string'
        });

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

        setupOptions.additionalLabels = utils.validateInput({
            input: additionalLabels,
            isValidInputFn: utils.isArray,
            defaultValue: [],
            errorMessage: 'additionalLabels should be an array'
        });

        setupOptions.extractAdditionalLabelValuesFn = utils.validateInput({
            input: extractAdditionalLabelValuesFn,
            isValidInputFn: utils.isFunction,
            defaultValue: () => ({}),
            errorMessage: 'extractAdditionalLabelValuesFn should be a function'
        });

        setupOptions.excludeDefaultMetricLabels = utils.validateInput({
            input: excludeDefaultMetricLabels,
            isValidInputFn: (input) => utils.isArray(input) || utils.isBoolean(input),
            defaultValue: [],
            errorMessage: 'excludeDefaultMetricLabels should be an array or a boolean'
        });

        setupOptions.useCountersForRequestSizeMetric = utils.validateInput({
            input: useCountersForRequestSizeMetric,
            isValidInputFn: utils.isBoolean,
            defaultValue: false,
            errorMessage: 'useCountersForRequestSizeMetric should be a boolean'
        });

        setupOptions.useCountersForResponseSizeMetric = utils.validateInput({
            input: useCountersForResponseSizeMetric,
            isValidInputFn: utils.isBoolean,
            defaultValue: false,
            errorMessage: 'useCountersForResponseSizeMetric should be a boolean'
        });

        const metricNames = utils.getMetricNames({
            metricNames: {
                app_version: 'app_version',
                http_request_duration_seconds: 'http_request_duration_seconds',
                http_request_size_bytes: 'http_request_size_bytes',
                http_request_size_bytes_sum: 'http_request_size_bytes_sum',
                http_request_size_bytes_count: 'http_request_size_bytes_count',
                http_response_size_bytes: 'http_response_size_bytes',
                http_response_size_bytes_sum: 'http_response_size_bytes_sum',
                http_response_size_bytes_count: 'http_response_size_bytes_count',
                defaultMetricsPrefix: ''
            },
            useUniqueHistogramName,
            metricsPrefix,
            httpMetricsPrefix,
            projectName
        });

        Prometheus.collectDefaultMetrics({ timeout: defaultMetricsInterval, prefix: `${metricNames.defaultMetricsPrefix}` });

        PrometheusRegisterAppVersion(appVersion, metricNames.app_version);

        const defaultMetricLabels = ['method', 'route', 'code'];

        const metricLabels = [
            ...additionalLabels,
            ...excludeDefaultMetricLabels === true
                ? []
                : Array.isArray(excludeDefaultMetricLabels)
                    ? defaultMetricLabels.filter((defaultLabel) => excludeDefaultMetricLabels.indexOf(defaultLabel) < 0)
                    : defaultMetricLabels
        ].filter(Boolean);

        // Buckets for response time from 1ms to 500ms
        const defaultDurationSecondsBuckets = [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5];
        // Buckets for request size from 5 bytes to 10000 bytes
        const defaultSizeBytesBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

        // Request Size Metric
        if (useCountersForRequestSizeMetric) {
            setupOptions.requestSizeSum = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes_sum) || new Prometheus.Counter({
                name: metricNames.http_request_size_bytes_sum,
                help: 'Sum of the size of HTTP requests in bytes',
                labelNames: metricLabels
            });
            setupOptions.requestSizeCount = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes_count) || new Prometheus.Counter({
                name: metricNames.http_request_size_bytes_count,
                help: 'Count of the size of HTTP requests',
                labelNames: metricLabels
            });
        } else {
            setupOptions.requestSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes) || new Prometheus.Histogram({
                name: metricNames.http_request_size_bytes,
                help: 'Size of HTTP requests in bytes',
                labelNames: metricLabels,
                buckets: requestSizeBuckets || defaultSizeBytesBuckets
            });
        }

        // Response Size Metric
        if (useCountersForResponseSizeMetric) {
            setupOptions.responseSizeSum = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes_sum) || new Prometheus.Counter({
                name: metricNames.http_response_size_bytes_sum,
                help: 'Sum of the size of HTTP responses in bytes',
                labelNames: metricLabels
            });
            setupOptions.responseSizeCount = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes_count) || new Prometheus.Counter({
                name: metricNames.http_response_size_bytes_count,
                help: 'Count of the size of HTTP responses',
                labelNames: metricLabels
            });
        } else {
            setupOptions.responseSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes) || new Prometheus.Histogram({
                name: metricNames.http_response_size_bytes,
                help: 'Size of HTTP response in bytes',
                labelNames: metricLabels,
                buckets: responseSizeBuckets || defaultSizeBytesBuckets
            });
        }

        // Response Time Metric
        setupOptions.responseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_duration_seconds) || new Prometheus.Histogram({
            name: metricNames.http_request_duration_seconds,
            help: 'Duration of HTTP requests in seconds',
            labelNames: metricLabels,
            buckets: durationBuckets || defaultDurationSecondsBuckets
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
