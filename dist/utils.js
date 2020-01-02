"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getMetricNames(metricNames, useUniqueHistogramName, metricsPrefix, projectName) {
    let prefix = useUniqueHistogramName === true ? projectName : metricsPrefix;
    if (prefix) {
        Object.keys(metricNames).forEach(key => {
            metricNames[key] = `${prefix}_${metricNames[key]}`;
        });
    }
    return metricNames;
}
exports.getMetricNames = getMetricNames;
function shouldLogMetrics(excludeRoutes, route) {
    return excludeRoutes.every((path) => {
        return !route.includes(path);
    });
}
exports.shouldLogMetrics = shouldLogMetrics;
function debug(a, b) {
    console.log(a, b);
}
exports.debug = debug;
function normalizeProjectName(name) {
    return name.replace(/-/g, '_');
}
exports.normalizeProjectName = normalizeProjectName;
//# sourceMappingURL=utils.js.map