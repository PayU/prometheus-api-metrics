

import metricsMiddleware from './middlewares/metrics-middleware'
import metricsCollector from './collector'

export default (projectName, appVersion) => metricsMiddleware(appVersion, projectName)

export const HttpMetricsCollector = (projectName) => metricsCollector(projectName)
export const KoaMiddlewareFactory = (projectName, appVersion) => metricsMiddleware(appVersion, projectName, 'koa')
export const ExpressMiddlewareFactory = (projectName, appVersion) => metricsMiddleware(appVersion, projectName, 'express')
