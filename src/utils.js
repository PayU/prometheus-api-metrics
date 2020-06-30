'use strict';

function getMetricNames(metricNames, useUniqueHistogramName, metricsPrefix, projectName) {
    const prefix = useUniqueHistogramName === true ? projectName : metricsPrefix;

    if (prefix) {
        Object.keys(metricNames).forEach(key => {
            metricNames[key] = `${prefix}_${metricNames[key]}`;
        });
    }

    return metricNames;
}

function shouldLogMetrics(excludeRoutes, route) {
    return excludeRoutes.every((path) => {
        return !route.includes(path);
    });
}

module.exports.getMetricNames = getMetricNames;
module.exports.shouldLogMetrics = shouldLogMetrics;
