'use strict';

const Prometheus = require('prom-client');
const expect = require('chai').expect;
const request = require('request');
const requestPromise = require('request-promise-native');
const Collector = require('../../src/request-response-collector')('prometheus_api_metrics');

describe('request.js response time collector', () => {
    describe('while using request', () => {
        describe('initizlized with defaults', () => {
            before(() => {
                Collector.init();
            });
            afterEach(() => {
                Prometheus.register.resetMetrics();
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('should collect metrics with path and method for valid request', (done) => {
                request({ url: 'http://www.google.com', time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="connect"} 1');
                    done();
                });
            });
            it('should collect metrics with path and method for valid request (500)', (done) => {
                request({ url: 'http://www.mocky.io/v2/5bd57525310000680041daf2', time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="connect"} 1');
                    done();
                });
            });
            it('should collect metrics with path and method for valid request (POST)', (done) => {
                request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1');
                    done();
                });
            });
            it('should collect metrics with path and method for valid request override route field on the request', (done) => {
                request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { route: '/v2/:id' }, time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="connect"} 1');
                    done();
                });
            });
            it('should collect metrics with path and method for valid request override target field on the request', (done) => {
                request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com' }, time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1');
                    done();
                });
            });
            it('should collect metrics with path and method for valid request override target and route field on the request', (done) => {
                request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com', route: '/v2/:id' }, time: true }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="connect"} 1');
                    done();
                });
            });
            it('should not collect metrics when time = true in the request is missing', (done) => {
                request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { route: 'v2/:id' } }, (err, response) => {
                    if (err) {
                        return done(err);
                    }
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="connect"} 1');
                    done();
                });
            });
            it('should count client error in counter', (done) => {
                request({ url: 'http://www.google1234.com', time: true, metrics: { route: 'route' } }, (err, response) => {
                    if (err) {
                        Collector.collect(err);
                        expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                        return done();
                    }
                    done(new Error('Expect to get error from the http request'));
                });
            });
        });
        describe('initialized with countClientErrors = true', () => {
            before(() => {
                Collector.init({ countClientErrors: true });
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('should count client error in counter', (done) => {
                request({ url: 'http://www.google1234.com', time: true, metrics: { route: 'route' } }, (err, response) => {
                    if (err) {
                        Collector.collect(err);
                        expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                        return done();
                    }
                    done(new Error('Expect to get error from the http request'));
                });
            });
        });
        describe('initialized with countClientErrors = false', () => {
            before(() => {
                Collector.init({ countClientErrors: false });
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('shouldn\'t count client error in counter', (done) => {
                request({ url: 'http://www.google1234.com', time: true, metrics: { route: 'route' } }, (err, response) => {
                    if (err) {
                        Collector.collect(err);
                        expect(Prometheus.register.metrics()).to.not.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                        return done();
                    }
                    done(new Error('Expect to get error from the http request'));
                });
            });
        });
    });
    describe('while using request-promise-native', () => {
        describe('Initialize with defaults', () => {
            before(() => {
                Collector.init();
            });
            afterEach(() => {
                Prometheus.register.resetMetrics();
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('should collect metrics with path and method for valid request', () => {
                return requestPromise({ url: 'http://www.google.com', time: true, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="connect"} 1');
                });
            });
            it('should collect metrics with path and method for valid request (500)', () => {
                return requestPromise({ url: 'http://www.mocky.io/v2/5bd57525310000680041daf2', time: true, resolveWithFullResponse: true }).then((response) => {
                    Promise.reject(new Error('Expect to get 500 from the request'));
                }).catch((error) => {
                    Collector.collect(error);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="GET",route="/v2/5bd57525310000680041daf2",status_code="500",type="connect"} 1');
                });
            });
            it('should collect metrics with path and method for valid request (POST)', () => {
                return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', time: true, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1');
                });
            });
            it('should collect metrics with path and method for valid request override route field on the request', () => {
                return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { route: '/v2/:id' }, time: true, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="/v2/:id",status_code="201",type="connect"} 1');
                });
            });
            it('should collect metrics with path and method for valid request override target field on the request', () => {
                return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com' }, time: true, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/5bd9984b2f00006d0006d1fd",status_code="201",type="connect"} 1');
                });
            });
            it('should collect metrics with path and method for valid request override target and route field on the request', () => {
                return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com', route: '/v2/:id' }, time: true, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="POST",route="/v2/:id",status_code="201",type="connect"} 1');
                });
            });
            it('should not collect metrics when time = true in the request is missing', () => {
                return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { route: 'v2/:id' }, resolveWithFullResponse: true }).then((response) => {
                    Collector.collect(response);
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="total"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="socket"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="lookup"} 1');
                    expect(Prometheus.register.metrics()).to.not.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.mocky.io",method="POST",route="v2/:id",status_code="201",type="connect"} 1');
                });
            });
            it('should count client error in counter by default', () => {
                return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                    Collector.collect(error);
                    expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                });
            });
        });
        describe('initialized with countClientErrors = true', () => {
            before(() => {
                Collector.init({ countClientErrors: true });
            });
            afterEach(() => {
                Prometheus.register.resetMetrics();
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('should count client error in counter', () => {
                return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                    Collector.collect(error);
                    expect(Prometheus.register.metrics()).to.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                });
            });
        });
        describe('initialized with countClientErrors = false', () => {
            before(() => {
                Collector.init({ countClientErrors: false });
            });
            afterEach(() => {
                Prometheus.register.resetMetrics();
            });
            after(() => {
                Prometheus.register.clear();
            });
            it('shouldn\'t count client error in counter', () => {
                return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                    Collector.collect(error);
                    expect(Prometheus.register.metrics()).to.not.include('southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                });
            });
        });
    });
    describe('initizalized with useUniqueHistogramName = true', () => {
        before(() => {
            Collector.init({ useUniqueHistogramName: true });
        });
        afterEach(() => {
            Prometheus.register.resetMetrics();
        });
        after(() => {
            Prometheus.register.clear();
        });
        it('should collect metrics with path and method for valid request with project name', (done) => {
            request({ url: 'http://www.google.com', time: true }, (err, response) => {
                if (err) {
                    return done(err);
                }
                Collector.collect(response);
                expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_request_duration_seconds_bucket');
                done();
            });
        });
        it('should count client error in counter with project name', () => {
            return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                Collector.collect(error);
                expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
            });
        });
    });
    describe('initizalized with prefix name', () => {
        before(() => {
            Collector.init({ prefix: 'prefix' });
        });
        afterEach(() => {
            Prometheus.register.resetMetrics();
        });
        after(() => {
            Prometheus.register.clear();
        });
        it('should collect metrics with path and method for valid request with prefix', (done) => {
            request({ url: 'http://www.google.com', time: true }, (err, response) => {
                if (err) {
                    return done(err);
                }
                Collector.collect(response);
                expect(Prometheus.register.metrics()).to.include('prefix_southbound_request_duration_seconds_bucket');
                done();
            });
        });
        it('should count client error in counter with prefix', () => {
            return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                Collector.collect(error);
                expect(Prometheus.register.metrics()).to.include('prefix_southbound_client_errors_count');
            });
        });
    });
    describe('initizalized with customized durationBuckets', () => {
        before(() => {
            Collector.init({ durationBuckets: [0.002, 0.01, 0.025, 0.035, 0.055, 0.15, 0.155, 0.35, 0.55] });
        });
        afterEach(() => {
            Prometheus.register.resetMetrics();
        });
        after(() => {
            Prometheus.register.clear();
        });
        it('should collect metrics with path and method for valid request', (done) => {
            request({ url: 'http://www.google.com', time: true }, (err, response) => {
                if (err) {
                    return done(err);
                }
                Collector.collect(response);
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.002"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.01"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.025"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.035"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.055"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.15"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.155"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.35"');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="0.55"');
                done();
            });
        });
    });
    describe('initizalized with both useUniqueHistogramName = true and prefix', () => {
        before(() => {
            Collector.init({ useUniqueHistogramName: true, prefix: 'prefix' });
        });
        afterEach(() => {
            Prometheus.register.resetMetrics();
        });
        after(() => {
            Prometheus.register.clear();
        });
        it('shouldn\'t count client error in counter with project name', () => {
            return requestPromise({ method: 'POST', url: 'http://www.google1234.com', metrics: { route: 'v2/:id' }, time: true, resolveWithFullResponse: true }).catch((error) => {
                Collector.collect(error);
                expect(Prometheus.register.metrics()).to.include('prometheus_api_metrics_southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
                expect(Prometheus.register.metrics()).to.not.include('prefix_southbound_client_errors_count{target="www.google1234.com",error="ENOTFOUND"} 1');
            });
        });
    });
    describe('use claas format', function () {
        let collectorInstance;
        before(function () {
            collectorInstance = new Collector();
        });
        afterEach(() => {
            Prometheus.register.resetMetrics();
        });
        after(() => {
            Prometheus.register.clear();
        });
        it('should collect metrics with path and method for valid request', (done) => {
            request({ url: 'http://www.google.com', time: true }, (err, response) => {
                if (err) {
                    return done(err);
                }
                collectorInstance.collect(response);
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="total"} 1');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="socket"} 1');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="lookup"} 1');
                expect(Prometheus.register.metrics()).to.include('southbound_request_duration_seconds_bucket{le="+Inf",target="www.google.com",method="GET",route="/",status_code="200",type="connect"} 1');
                done();
            });
        });
    });
});