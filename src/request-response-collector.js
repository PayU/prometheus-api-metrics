const Prometheus = require('prom-client');
const utils = require('./utils');
const get = require('lodash.get');

let southboundResponseTimeHistogram, southboundClientErrors = null;
let projectName;

module.exports = (name) => {
    projectName = name;
    const httpMetricsCollector = HttpMetricsCollector;
    httpMetricsCollector.init = init;
    httpMetricsCollector.collect = collect;

    return httpMetricsCollector;
};

const OBSERVER_TYPES = ['total', 'socket', 'lookup', 'connect'];

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
        const error = res.error || res;
        southboundClientErrors.inc({ target: error.hostname, error: error.code });
    } else {
        const response = res.response || res;
        if (response.timings) {
            const responseData = extractResponseData(response);
            addObservers(southboundResponseTimeHistogram, responseData);
        }
    }
}

function addObservers(southboundResponseTimeHistogram, responseData) {
    const { target, method, route, status_code, timings } = responseData;

    OBSERVER_TYPES.forEach(type => {
        if (typeof responseData.timings[type] !== 'undefined') {
            southboundResponseTimeHistogram.observe({ target, method, route, status_code, type }, timings[type]);
        }
    });
}

function extractResponseData(response) {
    let status_code, route, method, target, timings;

    // check if response client is axios
    if (isAxiosResponse(response)) {
        status_code = response.status;
        method = response.config.method.toUpperCase();
        route = get(response, 'config.metrics.route', response.config.url);
        target = get(response, 'config.metrics.target', response.config.baseURL);
        timings = {
            total: response.timings.elapsedTime / 1000
        };
    } else { // response is request-promise
        status_code = response.statusCode;
        method = response.request.method;
        route = get(response, 'request.metrics.route', response.request.path);
        target = get(response, 'request.metrics.target', response.request.originalHost);
        timings = {
            total: response.timingPhases.total / 1000,
            socket: response.timingPhases.wait / 1000,
            lookup: response.timingPhases.dns / 1000,
            connect: response.timingPhases.tcp / 1000
        };
    }

    return {
        target,
        method,
        route,
        status_code,
        timings
    };
}

function isAxiosResponse(response) {
    return response.config && response.hasOwnProperty('data');
}

function _init(options = {}) {
    let metricNames = {
        southbound_request_duration_seconds: 'southbound_request_duration_seconds',
        southbound_client_errors_count: 'southbound_client_errors_count'
    };

    const { durationBuckets, countClientErrors, useUniqueHistogramName, prefix } = options;
    metricNames = utils.getMetricNames(metricNames, useUniqueHistogramName, prefix, projectName);

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

function init(options) {
    const setup = _init(options);
    southboundResponseTimeHistogram = setup.southboundResponseTimeHistogram;
    southboundClientErrors = setup.southboundClientErrors;
};
function collect(res) {
    _collectHttpTiming(res, southboundResponseTimeHistogram, southboundClientErrors);
};
