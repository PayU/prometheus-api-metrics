"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prom_client_1 = __importDefault(require("prom-client"));
const { getMetricNames } = require('./utils');
class HttpMetricsCollector {
    constructor(projectName, options = {}) {
        this.projectName = projectName;
        let metricNames = {
            southbound_request_duration_seconds: 'southbound_request_duration_seconds',
            southbound_client_errors_count: 'southbound_client_errors_count'
        };
        const { durationBuckets, countClientErrors, useUniqueHistogramName, prefix } = options;
        metricNames = getMetricNames(metricNames, useUniqueHistogramName, prefix, this.projectName);
        this.southboundResponseTimeHistogram = prom_client_1.default.register.getSingleMetric(metricNames.southbound_request_duration_seconds) ||
            new prom_client_1.default.Histogram({
                name: metricNames.southbound_request_duration_seconds,
                help: 'Duration of Southbound queries in seconds',
                labelNames: ['method', 'route', 'status_code', 'target', 'type'],
                buckets: durationBuckets || [0.001, 0.005, 0.015, 0.03, 0.05, 0.1, 0.15, 0.3, 0.5]
            });
        if (countClientErrors !== false) {
            this.southboundClientErrors = prom_client_1.default.register.getSingleMetric(metricNames.southbound_client_errors_count) || new prom_client_1.default.Counter({
                name: metricNames.southbound_client_errors_count,
                help: 'Southbound http client error counter',
                labelNames: ['target', 'error']
            });
        }
    }
    collect(res) {
        if (res instanceof Error && !res.response && this.southboundClientErrors) {
            console.log(res);
            let error = res['error'] || res;
            this.southboundClientErrors.inc({ target: error.hostname, error: error.code });
        }
        else {
            let response = res.response || res;
            if (response.timings) {
                response.request.metrics = response.request.metrics || {};
                const histogramDefault = {
                    target: response.request.metrics.target || response.request.originalHost,
                    method: response.request.method,
                    route: response.request.metrics.route || response.request.path,
                    status_code: response.statusCode
                };
                this.southboundResponseTimeHistogram.observe(Object.assign(Object.assign({}, histogramDefault), { type: 'total' }), response.timingPhases.total / 1000);
                this.southboundResponseTimeHistogram.observe(Object.assign(Object.assign({}, histogramDefault), { type: 'socket' }), response.timingPhases.wait / 1000); // timings.socket
                this.southboundResponseTimeHistogram.observe(Object.assign(Object.assign({}, histogramDefault), { type: 'lookup' }), response.timingPhases.dns / 1000); // timings.lookup - timings.socket
                this.southboundResponseTimeHistogram.observe(Object.assign(Object.assign({}, histogramDefault), { type: 'connect' }), response.timingPhases.tcp / 1000); // timings.connect - timings.socket
            }
        }
    }
}
exports.HttpMetricsCollector = HttpMetricsCollector;
//# sourceMappingURL=collector.js.map