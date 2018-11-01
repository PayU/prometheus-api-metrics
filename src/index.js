'use strict';

const Path = require('path');
const metricsMiddleware = { exports: {} };
require('pkginfo')(metricsMiddleware, { dir: Path.dirname(module.parent.filename), include: ['name', 'version'] });
const appVersion = metricsMiddleware.exports.version;
const projectName = metricsMiddleware.exports.name.replace(/-/g, '_');

const middleware = require('./metrics-middleware')(appVersion, projectName);
const httpCollector = require('./request-response-collector');

module.exports = middleware;
module.exports.httpCollector = httpCollector;