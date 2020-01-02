"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_1 = __importDefault(require("./middlewares/metrics"));
const collector_1 = require("./collector");
const utils_1 = require("./utils");
let metricsCollector = [];
exports.HttpMetricsCollectorFactory = (projectName) => {
    const name = utils_1.normalizeProjectName(projectName);
    return metricsCollector[name] || new collector_1.HttpMetricsCollector(name);
};
exports.ExpressMiddlewareFactory = (projectName, appVersion = '1.0.0') => {
    const name = utils_1.normalizeProjectName(projectName);
    metricsCollector[name] = new collector_1.HttpMetricsCollector(name);
    return metrics_1.default(name, appVersion);
};
//# sourceMappingURL=index.js.map