'use strict';

const getMetricNames = ({ metricNames, useUniqueHistogramName, metricsPrefix, httpMetricsPrefix, projectName }) => {
    const prefix = useUniqueHistogramName === true ? projectName : metricsPrefix;

    Object.keys(metricNames).forEach(key => {
        if (httpMetricsPrefix && key.startsWith('http_')) {
            metricNames[key] = `${httpMetricsPrefix}_${metricNames[key]}`;
        } else if (prefix) {
            metricNames[key] = `${prefix}_${metricNames[key]}`;
        }
    });

    return metricNames;
};

const isArray = (input) => Array.isArray(input);

const isBoolean = (input) => typeof input === 'boolean';

const isFunction = (input) => typeof input === 'function';

const isString = (input) => typeof input === 'string';

const shouldLogMetrics = (excludeRoutes, route) => excludeRoutes.every((path) => !route.includes(path));

const validateInput = ({ input, isValidInputFn, defaultValue, errorMessage }) => {
    if (typeof input !== 'undefined') {
        if (isValidInputFn(input)) {
            return input;
        } else {
            throw new Error(errorMessage);
        }
    }

    return defaultValue;
};

module.exports.getMetricNames = getMetricNames;
module.exports.isArray = isArray;
module.exports.isBoolean = isBoolean;
module.exports.isFunction = isFunction;
module.exports.isString = isString;
module.exports.shouldLogMetrics = shouldLogMetrics;
module.exports.validateInput = validateInput;
