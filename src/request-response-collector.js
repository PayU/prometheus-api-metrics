const Prometheus = require('prom-client');
const Path = require('path');
let southboundResponseTimeHistogram, southboundClientErrors = null;

class HttpMetricsCollector {
    constructor(options){
        const setup = _init(options);
        this.southboundResponseTimeHistogram = setup.southboundResponseTimeHistogram;
        this.southboundClientErrors = setup.southboundClientErrors;
    };

    collect(res) {
        _collectHttpTiming(res, this.southboundResponseTimeHistogram, this.southboundClientErrors);
    }
}

function _collectHttpTiming(res, southboundResponseTimeHistogram, southboundClientErrors) {
    if (res instanceof Error && !res.response && southboundClientErrors) {
        let error = res.error || res;
        southboundClientErrors.inc({ target: error.hostname, error: error.code });
    } else {
        let response = res.response || res;
        response.request.metrics = response.request.metrics || {};
        if (response.timings) {
            southboundResponseTimeHistogram.observe({ target: response.request.metrics.target || response.request.originalHost, method: response.request.method, route: response.request.metrics.route || response.request.path, status_code: response.statusCode, type: 'total' }, response.timingPhases.total);
            southboundResponseTimeHistogram.observe({ target: response.request.metrics.target || response.request.originalHost, method: response.request.method, route: response.request.metrics.route || response.request.path, status_code: response.statusCode, type: 'socket' }, response.timingPhases.wait); // timings.socket
            southboundResponseTimeHistogram.observe({ target: response.request.metrics.target || response.request.originalHost, method: response.request.method, route: response.request.metrics.route || response.request.path, status_code: response.statusCode, type: 'lookup' }, response.timingPhases.dns); // timings.lookup - timings.socket
            southboundResponseTimeHistogram.observe({ target: response.request.metrics.target || response.request.originalHost, method: response.request.method, route: response.request.metrics.route || response.request.path, status_code: response.statusCode, type: 'connect' }, response.timingPhases.tcp); // timings.connect - timings.socket
        }
    }
}

function _init(options = {}) {
    const metricNames = {
        southbound_request_duration_seconds: 'southbound_request_duration_seconds',
        southbound_client_errors_count: 'southbound_client_errors_count'
    };

    const metricsMiddleware = { exports: {} };
    require('pkginfo')(metricsMiddleware, { dir: Path.dirname(module.parent.filename), include: ['name'] });
    const projectName = metricsMiddleware.exports.name.replace(/-/g, '_');
    const { durationBuckets, countClientErrors, useUniqueHistogramName, prefix } = options;

    if (useUniqueHistogramName === true || prefix) {
        let metricsPrefix = useUniqueHistogramName === true ? projectName : prefix;
        metricNames.southbound_request_duration_seconds = `${metricsPrefix}_${metricNames.southbound_request_duration_seconds}`;
        metricNames.southbound_client_errors_count = `${metricsPrefix}_${metricNames.southbound_client_errors_count}`;
    }

    southboundResponseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.southbound_request_duration_seconds) ||
        new Prometheus.Histogram({
            name: metricNames.southbound_request_duration_seconds,
            help: 'Duration of Southbound queries in seconds',
            labelNames: ['method', 'route', 'status_code', 'target', 'type'],
            buckets: durationBuckets || [0.001, 0.005, 0.015, 0.03, 0.05, 0.1, 0.15, 0.3, 0.5]
        });

    if (countClientErrors !== false) {
        southboundClientErrors = Prometheus.register.getSingleMetric(metricNames.southbound_client_errors_count) || new Prometheus.Counter({
            name: metricNames.southbound_client_errors_count,
            help: 'Southbound http client error counter',
            labelNames: ['target', 'error']
        });
    }

    return {
        southboundClientErrors: southboundClientErrors,
        southboundResponseTimeHistogram: southboundResponseTimeHistogram
    };
};

module.exports = HttpMetricsCollector;
module.exports.init = (options) => {
    const setup = _init(options);
    southboundResponseTimeHistogram = setup.southboundResponseTimeHistogram;
    southboundClientErrors = setup.southboundClientErrors;
};
module.exports.collect = (res) => {
    _collectHttpTiming(res, southboundResponseTimeHistogram, southboundClientErrors);
};
