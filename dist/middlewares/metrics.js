"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prom_client_1 = __importDefault(require("prom-client"));
const express_1 = __importDefault(require("./express"));
const utils_1 = require("../utils");
exports.default = (projectName, appVersion) => {
    return (setup = {}) => {
        const { durationBuckets, requestSizeBuckets, responseSizeBuckets, useUniqueHistogramName, metricsPrefix } = setup;
        const defaultOptions = {
            path: '/metrics',
            excludeRoutes: [],
            includeQueryParams: undefined,
            defaultMetricsInterval: 10000
        };
        const options = Object.assign(Object.assign({}, defaultOptions), setup);
        utils_1.debug(`Init metrics middleware with options: ${JSON.stringify(options)}`);
        const defaultMetricNames = {
            http_request_duration_seconds: 'http_request_duration_seconds',
            app_version: 'app_version',
            http_request_size_bytes: 'http_request_size_bytes',
            http_response_size_bytes: 'http_response_size_bytes',
            defaultMetricsPrefix: ''
        };
        const metricNames = utils_1.getMetricNames(defaultMetricNames, useUniqueHistogramName, metricsPrefix, projectName);
        prom_client_1.default.collectDefaultMetrics({
            timeout: options.defaultMetricsInterval,
            prefix: `${metricNames.defaultMetricsPrefix}`
        });
        if (!prom_client_1.default.register.getSingleMetric(metricNames.app_version)) {
            const version = new prom_client_1.default.Gauge({
                name: metricNames.app_version,
                help: 'The service version by package.json',
                labelNames: ['version', 'major', 'minor', 'patch']
            });
            const versionSegments = appVersion.split('.').map(Number);
            version.labels(appVersion, versionSegments[0], versionSegments[1], versionSegments[2]).set(1);
        }
        options.responseTimeHistogram = prom_client_1.default.register.getSingleMetric(metricNames.http_request_duration_seconds) || new prom_client_1.default.Histogram({
            name: metricNames.http_request_duration_seconds,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'code'],
            // buckets for response time from 1ms to 500ms
            buckets: durationBuckets || [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]
        });
        options.requestSizeHistogram = prom_client_1.default.register.getSingleMetric(metricNames.http_request_size_bytes) || new prom_client_1.default.Histogram({
            name: metricNames.http_request_size_bytes,
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: requestSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] // buckets for response time from 5 bytes to 10000 bytes
        });
        options.responseSizeHistogram = prom_client_1.default.register.getSingleMetric(metricNames.http_response_size_bytes) || new prom_client_1.default.Histogram({
            name: metricNames.http_response_size_bytes,
            help: 'Size of HTTP response in bytes',
            labelNames: ['method', 'route', 'code'],
            buckets: responseSizeBuckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] // buckets for response time from 5 bytes to 10000 bytes
        });
        const middleware = new express_1.default(options);
        return middleware.middleware.bind(middleware);
    };
};
//# sourceMappingURL=metrics.js.map