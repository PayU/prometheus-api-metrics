import Prometheus from 'prom-client'
import Express from './express'
import { debug, getMetricNames } from '../utils'

export type Options = {
  server?: any,
  path?: string
  defaultMetricsInterval?: number
  durationBuckets?: any
  requestSizeBuckets?: any
  responseSizeBuckets?: any
  useUniqueHistogramName?: any
  metricsPrefix?: any
  excludeRoutes?: any
  includeQueryParams?: any,
  responseTimeHistogram?: any
  requestSizeHistogram?: any
  responseSizeHistogram?: any
  numberOfConnectionsGauge?: any
}

export default (projectName, appVersion) => {
  return (setup: Options = {}) => {
    const { durationBuckets, requestSizeBuckets, responseSizeBuckets, useUniqueHistogramName, metricsPrefix } = setup
    const defaultOptions: Options = {
      path: '/metrics',
      excludeRoutes: [],
      includeQueryParams: undefined,
      defaultMetricsInterval: 10000
    }
    const options: Options = {...defaultOptions, ...setup}
    debug(`Init metrics middleware with options: ${JSON.stringify(options)}`)

    const defaultMetricNames = {
      http_request_duration_seconds: 'http_request_duration_seconds',
      app_version: 'app_version',
      http_request_size_bytes: 'http_request_size_bytes',
      http_response_size_bytes: 'http_response_size_bytes',
      defaultMetricsPrefix: ''
    }
    const metricNames = getMetricNames(defaultMetricNames, useUniqueHistogramName, metricsPrefix, projectName)

    Prometheus.collectDefaultMetrics({
      timeout: options.defaultMetricsInterval,
      prefix: `${metricNames.defaultMetricsPrefix}`
    })

    if (!Prometheus.register.getSingleMetric(metricNames.app_version)) {
      const version = new Prometheus.Gauge({
        name: metricNames.app_version,
        help: 'The service version by package.json',
        labelNames: [ 'version', 'major', 'minor', 'patch' ]
      })

      const versionSegments = appVersion.split('.').map(Number)
      version.labels(appVersion, versionSegments[0], versionSegments[1], versionSegments[2]).set(1)
    }

    options.responseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_duration_seconds) || new Prometheus.Histogram({
      name: metricNames.http_request_duration_seconds,
      help: 'Duration of HTTP requests in seconds',
      labelNames: [ 'method', 'route', 'code' ],
      // buckets for response time from 1ms to 500ms
      buckets: durationBuckets || [ 0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5 ]
    })

    options.requestSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_request_size_bytes) || new Prometheus.Histogram({
      name: metricNames.http_request_size_bytes,
      help: 'Size of HTTP requests in bytes',
      labelNames: [ 'method', 'route', 'code' ],
      buckets: requestSizeBuckets || [ 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000 ] // buckets for response time from 5 bytes to 10000 bytes
    })

    options.responseSizeHistogram = Prometheus.register.getSingleMetric(metricNames.http_response_size_bytes) || new Prometheus.Histogram({
      name: metricNames.http_response_size_bytes,
      help: 'Size of HTTP response in bytes',
      labelNames: [ 'method', 'route', 'code' ],
      buckets: responseSizeBuckets || [ 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000 ] // buckets for response time from 5 bytes to 10000 bytes
    })

    const middleware = new Express(options)
    return middleware.middleware.bind(middleware)
  }
}
