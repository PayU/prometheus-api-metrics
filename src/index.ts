import metricsMiddleware from './middlewares/metrics'
import { HttpMetricsCollector } from './collector'
import { normalizeProjectName } from './utils'
let metricsCollector = []
export const HttpMetricsCollectorFactory = (projectName: string) => {
  const name = normalizeProjectName(projectName)
  return metricsCollector[name] || new HttpMetricsCollector(name)
}
export const ExpressMiddlewareFactory = (projectName: string, appVersion = '1.0.0') => {
  const name = normalizeProjectName(projectName)
  metricsCollector[name] = new HttpMetricsCollector(name)
  return metricsMiddleware(name, appVersion)
}
