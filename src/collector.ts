import Prometheus from 'prom-client'

const {getMetricNames} = require('./utils')

export class HttpMetricsCollector {
  private southboundResponseTimeHistogram
  private southboundClientErrors

  constructor(private projectName, options = {} as any) {
    let metricNames = {
      southbound_request_duration_seconds: 'southbound_request_duration_seconds',
      southbound_client_errors_count: 'southbound_client_errors_count'
    }

    const { durationBuckets, countClientErrors, useUniqueHistogramName, prefix } = options
    metricNames = getMetricNames(metricNames, useUniqueHistogramName, prefix, this.projectName)

    this.southboundResponseTimeHistogram = Prometheus.register.getSingleMetric(metricNames.southbound_request_duration_seconds) ||
      new Prometheus.Histogram({
        name: metricNames.southbound_request_duration_seconds,
        help: 'Duration of Southbound queries in seconds',
        labelNames: [ 'method', 'route', 'status_code', 'target', 'type' ],
        buckets: durationBuckets || [ 0.001, 0.005, 0.015, 0.03, 0.05, 0.1, 0.15, 0.3, 0.5 ]
      })

    if (countClientErrors !== false) {
      this.southboundClientErrors = Prometheus.register.getSingleMetric(metricNames.southbound_client_errors_count) || new Prometheus.Counter({
        name: metricNames.southbound_client_errors_count,
        help: 'Southbound http client error counter',
        labelNames: [ 'target', 'error' ]
      })
    }
  }

  collect(res: any) {
    if (res instanceof Error && !(res as any).response && this.southboundClientErrors) {
      console.log(res)
      let error = res['error'] || res
      this.southboundClientErrors.inc({ target: error.hostname, error: error.code })
    } else {
      let response = res.response || res
      if (response.timings) {
        response.request.metrics = response.request.metrics || {}

        const histogramDefault = {
          target: response.request.metrics.target || response.request.originalHost,
          method: response.request.method,
          route: response.request.metrics.route || response.request.path,
          status_code: response.statusCode
        }

        this.southboundResponseTimeHistogram.observe({
          ...histogramDefault,
          type: 'total'
        }, response.timingPhases.total / 1000)
        this.southboundResponseTimeHistogram.observe({
          ...histogramDefault,
          type: 'socket'
        }, response.timingPhases.wait / 1000) // timings.socket
        this.southboundResponseTimeHistogram.observe({
          ...histogramDefault,
          type: 'lookup'
        }, response.timingPhases.dns / 1000) // timings.lookup - timings.socket
        this.southboundResponseTimeHistogram.observe({
          ...histogramDefault,
          type: 'connect'
        }, response.timingPhases.tcp / 1000) // timings.connect - timings.socket
      }
    }
  }
}
