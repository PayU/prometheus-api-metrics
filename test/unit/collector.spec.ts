import Prometheus from 'prom-client'
import { expect } from 'chai'
import request from 'request-promise-native'
import nock from 'nock'
import { HttpMetricsCollector } from '../../src/collector'

describe('request.js response time collector', () => {
  describe('while using request-promise-native', () => {
    let Collector

    describe('Initialize with defaults', () => {
      before(() => {
        Collector = new HttpMetricsCollector('prometheus_api_metrics')
      })
      afterEach(() => {
        Prometheus.register.resetMetrics()
      })
      after(() => {
        Prometheus.register.clear()
      })
      it('should collect metrics with path and method for valid request', async () => {
        nock('http://www.google.com').get('/').reply(200)
        const response = await request({
          url: 'http://www.google.com',
          time: true,
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="total"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="connect"} 1')
      })
      it('should collect metrics with path and method for valid request (500)', () => {
        nock('http://www.mocky.io').get('/v2/5bd57525310000680041daf2').reply(500)
        return request({
          url: 'http://www.mocky.io/v2/5bd57525310000680041daf2',
          time: true,
          resolveWithFullResponse: true
        }).then((response) => {
          Promise.reject(new Error('Expect to get 500 from the request'))
        }).catch((error) => {
          Collector.collect(error)
          expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="total"} 1')
          expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="socket"} 1')
          expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="lookup"} 1')
          expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="connect"} 1')
        })
      })
      it('should collect metrics with path and method for valid request (POST)', async () => {
        nock('http://www.mocky.io').post('/v2/5bd9984b2f00006d0006d1fd').reply(201)
        const response = await request({
          method: 'POST',
          url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
          time: true,
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1')
      })
      it('should collect metrics with path and method for valid request override route field on the request', async () => {
        nock('http://www.mocky.io').post('/v2/5bd9984b2f00006d0006d1fd').reply(201)
        const response = await request({
          method: 'POST',
          url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
          metrics: { route: '/v2/:id' },
          time: true,
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="total"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="connect"} 1')
      })
      it('should collect metrics with path and method for valid request override target field on the request', async () => {
        nock('http://www.mocky.io').post('/v2/5bd9984b2f00006d0006d1fd').reply(201)
        const response = await request({
          method: 'POST',
          url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
          metrics: { target: 'www.google.com' },
          time: true,
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1')
      })
      it('should collect metrics with path and method for valid request override target and route field on the request', async () => {
        nock('http://www.mocky.io').post('/v2/5bd9984b2f00006d0006d1fd').reply(201)
        const response = await request({
          method: 'POST',
          url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
          metrics: { target: 'www.google.com', route: '/v2/:id' },
          time: true,
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="total"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="connect"} 1')
      })
      it('should not collect metrics when time = true in the request is missing', async () => {
        nock('http://www.mocky.io').post('/v2/5bd9984b2f00006d0006d1fd').reply(201)
        const response = await request({
          method: 'POST',
          url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
          metrics: { route: 'v2/:id' },
          resolveWithFullResponse: true
        })
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="total"} 1')
        expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="socket"} 1')
        expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="lookup"} 1')
        expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="connect"} 1')
      })
      it('should count client error in counter by default', () => {
        return request({
          method: 'POST',
          url: 'http://www.mocky1.io/v2/12345',
          metrics: { route: 'v2/:id' },
          time: true,
          resolveWithFullResponse: true
        }).catch((error) => {
          Collector.collect(error)
          expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
        })
      })
    })
    describe('initialized with countClientErrors = true', () => {
      before(() => {
        Collector = new HttpMetricsCollector('prometheus_api_metrics', { countClientErrors: true })
      })
      afterEach(() => {
        Prometheus.register.resetMetrics()
      })
      after(() => {
        Prometheus.register.clear()
      })
      it('should count client error in counter', () => {
        return request({
          method: 'POST',
          url: 'http://www.mocky1.io/v2/12345',
          metrics: { route: 'v2/:id' },
          time: true,
          resolveWithFullResponse: true
        }).catch((error) => {
          Collector.collect(error)
          expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
        })
      })
    })
    describe('initialized with countClientErrors = false', () => {
      before(() => {
        Collector = new HttpMetricsCollector('prometheus_api_metrics', { countClientErrors: false })
      })
      afterEach(() => {
        Prometheus.register.resetMetrics()
      })
      after(() => {
        Prometheus.register.clear()
      })
      it('shouldn\'t count client error in counter', () => {
        return request({
          method: 'POST',
          url: 'http://www.mocky1.io/v2/12345',
          metrics: { route: 'v2/:id' },
          time: true,
          resolveWithFullResponse: true
        }).catch((error) => {
          Collector.collect(error)
          expect(Prometheus.register.metrics()).to.not.include('southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
        })
      })
    })
  })
  describe('initizalized with useUniqueHistogramName = true', () => {
    let Collector

    before(() => {
      Collector = new HttpMetricsCollector('prometheus_api_metrics', { useUniqueHistogramName: true })
    })
    afterEach(() => {
      Prometheus.register.resetMetrics()
    })
    after(() => {
      Prometheus.register.clear()
    })
    it('should collect metrics with path and method for valid request with project name', (done) => {
      nock('http://www.google.com').get('/').reply(200)
      request({ url: 'http://www.google.com', time: true, resolveWithFullResponse: true }, (err, response) => {
        if (err) {
          return done(err)
        }
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_request_duration_seconds_bucket')
        done()
      })
    })
    it('should count client error in counter with project name', () => {
      return request({
        method: 'POST',
        url: 'http://www.mocky1.io/v2/12345',
        metrics: { route: 'v2/:id' },
        time: true,
        resolveWithFullResponse: true
      }).catch((error) => {
        Collector.collect(error)
        expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
      })
    })
  })
  describe('initizalized with prefix name', () => {
    let Collector

    before(() => {
      Collector = new HttpMetricsCollector('prometheus_api_metrics', { prefix: 'prefix' })
    })
    afterEach(() => {
      Prometheus.register.resetMetrics()
    })
    after(() => {
      Prometheus.register.clear()
    })
    it('should collect metrics with path and method for valid request with prefix', (done) => {
      nock('http://www.google.com').get('/').reply(200)
      request({ url: 'http://www.google.com', time: true, resolveWithFullResponse: true }, (err, response) => {
        if (err) {
          return done(err)
        }
        Collector.collect(response)
        expect(Prometheus.register.metrics()).to.include('prefix_southbound_request_duration_seconds_bucket')
        done()
      })
    })
    it('should count client error in counter with prefix', () => {
      return request({
        method: 'POST',
        url: 'http://www.mocky1.io/v2/12345',
        metrics: { route: 'v2/:id' },
        time: true,
        resolveWithFullResponse: true
      }).catch((error) => {
        Collector.collect(error)
        expect(Prometheus.register.metrics()).to.include('prefix_southbound_client_errors_count')
      })
    })
  })
  describe('initizalized with customized durationBuckets', () => {
    let Collector

    before(() => {
      Collector = new HttpMetricsCollector('prometheus_api_metrics', { durationBuckets: [ 0.002, 0.01, 0.025, 0.035, 0.055, 0.15, 0.155, 0.35, 0.55 ] })
    })
    afterEach(() => {
      Prometheus.register.resetMetrics()
    })
    after(() => {
      Prometheus.register.clear()
    })
    it('should collect metrics with path and method for valid request', async () => {
      nock('http://www.google.com').get('/').reply(200)
      const response = await request({ url: 'http://www.google.com', time: true, resolveWithFullResponse: true })
      Collector.collect(response)
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.002"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.01"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.025"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.035"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.055"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.15"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.155"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.35"')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.55"')
    })
  })
  describe('initizalized with both useUniqueHistogramName = true and prefix', () => {
    let Collector

    before(() => {
      Collector = new HttpMetricsCollector('prometheus_api_metrics', { useUniqueHistogramName: true, prefix: 'prefix' })
    })
    afterEach(() => {
      Prometheus.register.resetMetrics()
    })
    after(() => {
      Prometheus.register.clear()
    })
    it('shouldn\'t count client error in counter with project name', () => {
      return request({
        method: 'POST',
        url: 'http://www.mocky1.io/v2/12345',
        metrics: { route: 'v2/:id' },
        time: true,
        resolveWithFullResponse: true
      }).catch((error) => {
        Collector.collect(error)
        expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
        expect(Prometheus.register.metrics()).to.not.include('prefix_southbound_client_errors_count{target="www.mocky1.io",error="ENOTFOUND"} 1')
      })
    })
  })
  describe('use class format', function () {
    let collectorInstance
    before(function () {
      collectorInstance = new HttpMetricsCollector('test')
    })
    afterEach(() => {
      Prometheus.register.resetMetrics()
    })
    after(() => {
      Prometheus.register.clear()
    })
    it('should collect metrics with path and method for valid request', async () => {
      nock('http://www.google.com').get('/').reply(200)
      const response = await request({ url: 'http://www.google.com', time: true, resolveWithFullResponse: true })
      collectorInstance.collect(response)
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="total"} 1')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="socket"} 1')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="lookup"} 1')
      expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="connect"} 1')
    })
  })
})
