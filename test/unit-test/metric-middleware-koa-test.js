'use strict';

const Prometheus = require('prom-client');
const sinon = require('sinon');
const expect = require('chai').expect;
const rewire = require('rewire');
const middleware = rewire('../../src/metrics-middleware')('1.0.0', 'Name', 'koa');
const httpMocks = require('node-mocks-http');
const EventEmitter = require('events').EventEmitter;

describe('metrics-middleware', () => {
    after(() => {
        Prometheus.register.clear();
    });
    describe('Tests with Koa as framework', () => {
        describe('when calling the function with options', () => {
            before(() => {
                middleware({
                    durationBuckets: [1, 10, 50, 100, 300, 500, 1000],
                    requestSizeBuckets: [0, 1, 5, 10, 15],
                    responseSizeBuckets: [250, 500, 1000, 2500, 5000, 10000, 15000, 20000]
                });
            });
            it('should have http_request_size_bytes metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').bucketValues).to.have.all.keys([0, 1, 5, 10, 15]);
            });
            it('should have http_request_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_request_duration_seconds metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').bucketValues).to.have.all.keys([1, 10, 50, 100, 300, 500, 1000]);
            });
            it('should have http_request_duration_seconds with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_response_size_bytes metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').bucketValues).to.have.all.keys([250, 500, 1000, 2500, 5000, 10000, 15000, 20000]);
            });
            it('should have http_response_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when calling the function with options (metrics prefix)', () => {
            before(() => {
                middleware({
                    durationBuckets: [1, 10, 50, 100, 300, 500, 1000],
                    requestSizeBuckets: [0, 1, 5, 10, 15],
                    responseSizeBuckets: [250, 500, 1000, 2500, 5000, 10000, 15000, 20000],
                    metricsPrefix: 'prefix'
                });
            });
            it('should have prefix_http_request_size_bytes metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_request_size_bytes').bucketValues).to.have.all.keys([0, 1, 5, 10, 15]);
            });
            it('should have prefix_http_request_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have prefix_http_request_duration_seconds metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_request_duration_seconds').bucketValues).to.have.all.keys([1, 10, 50, 100, 300, 500, 1000]);
            });
            it('should have prefix_http_request_duration_seconds with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have prefix_http_response_size_bytes metrics with custom buckets', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_response_size_bytes').bucketValues).to.have.all.keys([250, 500, 1000, 2500, 5000, 10000, 15000, 20000]);
            });
            it('should have prefix_http_response_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('prefix_http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have default metrics with prefix', () => {
                expect(Prometheus.register.getSingleMetric('prefix_process_cpu_user_seconds_total')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_process_cpu_system_seconds_total')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_process_cpu_seconds_total')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_process_start_time_seconds')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_process_resident_memory_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_eventloop_lag_seconds')).to.exist;

                expect(Prometheus.register.getSingleMetric('prefix_nodejs_active_handles_total')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_active_requests_total')).to.exist;

                expect(Prometheus.register.getSingleMetric('prefix_nodejs_heap_size_total_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_heap_size_used_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_external_memory_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_heap_space_size_total_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_heap_space_size_used_bytes')).to.exist;
                expect(Prometheus.register.getSingleMetric('prefix_nodejs_heap_space_size_available_bytes')).to.exist;

                expect(Prometheus.register.getSingleMetric('prefix_app_version')).to.exist;
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when calling the function with options empty arrays', () => {
            before(() => {
                middleware({
                    durationBuckets: [],
                    requestSizeBuckets: [],
                    responseSizeBuckets: []
                });
            });
            it('should have http_request_size_bytes metrics with default buckets', () => {
                expect(Object.keys(Prometheus.register.getSingleMetric('http_request_size_bytes').bucketValues)).to.have.lengthOf(0);
            });
            it('should have http_request_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_request_duration_seconds metrics with buckets', () => {
                expect(Object.keys(Prometheus.register.getSingleMetric('http_request_duration_seconds').bucketValues)).to.have.lengthOf(0);
            });
            it('should have http_request_duration_seconds with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_response_size_bytes metrics with default buckets', () => {
                expect(Object.keys(Prometheus.register.getSingleMetric('http_response_size_bytes').bucketValues)).to.have.lengthOf(0);
            });
            it('should have http_response_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when calling the function without options', () => {
            before(() => {
                middleware();
            });
            it('should have http_request_size_bytes metrics with default buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').bucketValues).to.have.all.keys([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);
            });
            it('should have http_request_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_request_duration_seconds metrics with default buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').bucketValues).to.have.all.keys([0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]);
            });
            it('should have http_request_duration_seconds with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_response_size_bytes metrics with default buckets', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').bucketValues).to.have.all.keys([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);
            });
            it('should have http_response_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when using the middleware request has body', () => {
            let func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
            });
            it('should save the request size and start time on the request', () => {
                expect(req.metrics.contentLength).to.equal(25);
            });
            it('should call next', () => {
                sinon.assert.calledOnce(next);
            });
            describe('when the request ends', () => {
                before(() => {
                    requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                    res.emit('finish');
                });
                it('should update the histogram with the elapsed time and size', () => {
                    sinon.assert.calledWithExactly(requestSizeObserve, {
                        method: 'GET',
                        route: '/path',
                        code: 200
                    }, 25);
                    sinon.assert.calledWith(responseTimeObserve, {
                        method: 'GET'
                    });
                    sinon.assert.calledWith(endTimerStub, {
                        route: '/path',
                        code: 200
                    });
                    sinon.assert.calledOnce(responseTimeObserve);
                    sinon.assert.calledOnce(endTimerStub);
                });
                after(() => {
                    requestSizeObserve.restore();
                    responseTimeObserve.restore();
                });
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when using the middleware request does\'t have body', () => {
            let func, req, res, ctx, next, responseTimeObserve, requestSizeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path',
                    method: 'GET'
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path/:id' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
            });
            it('should save the request size and start time on the request', () => {
                expect(req.metrics.contentLength).to.equal(0);
            });
            it('should call next', () => {
                sinon.assert.calledOnce(next);
            });
            describe('when the request ends', () => {
                before(() => {
                    requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                    res.emit('finish');
                });
                it('should update the histogram with the elapsed time and size', () => {
                    sinon.assert.calledWithExactly(requestSizeObserve, {
                        method: 'GET',
                        route: '/path/:id',
                        code: 200
                    }, 0);
                    sinon.assert.calledWith(responseTimeObserve, {
                        method: 'GET'
                    });
                    sinon.assert.calledWith(endTimerStub, {
                        route: '/path/:id',
                        code: 200
                    });
                    sinon.assert.calledOnce(endTimerStub);
                    sinon.assert.calledOnce(responseTimeObserve);
                });
                after(() => {
                    requestSizeObserve.restore();
                    responseTimeObserve.restore();
                });
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when using the middleware response has body', () => {
            let func, req, res, ctx, next, responseSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path',
                    method: 'GET'
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                res.statusCode = 200;
                res._headers = {
                    'content-length': '25'
                };
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path' };
                func = middleware();
                responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(responseSizeObserve, {
                    method: 'GET',
                    route: '/path',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/path',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                responseSizeObserve.restore();
                responseTimeObserve.restore();
                Prometheus.register.clear();
            });
        });
        describe('when using the middleware response does\'t have body', () => {
            let func, req, res, ctx, next, responseSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path',
                    method: 'GET'
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(responseSizeObserve, {
                    method: 'GET',
                    route: '/path',
                    code: 200
                }, 0);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/path',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                responseSizeObserve.restore();
                responseTimeObserve.restore();
                Prometheus.register.clear();
            });
        });
        describe('override the default path', () => {
            let func;
            beforeEach(() => {
                func = middleware({
                    metricsPath: '/v1/metrics'
                });
            });
            it('should set the updated route', () => {
                const next = sinon.stub();
                const set = sinon.stub();
                const ctx = { body: {}, set: set, req: { url: '/v1/metrics' } };
                func(ctx, next);
                sinon.assert.calledOnce(next);
                const ctxFormalized = ctx.body.replace(/ ([0-9]*[.])?[0-9]+[\x0a]/g, ' #num\n');
                const apiFormalized = Prometheus.register.metrics().replace(/ ([0-9]*[.])?[0-9]+[\x0a]/g, ' #num\n');
                expect(ctxFormalized).to.eql(apiFormalized);
                sinon.assert.calledWith(set, 'Content-Type', Prometheus.register.contentType);
                sinon.assert.calledOnce(set);
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when initialize the middleware twice', () => {
            let firstFunction, secondFunction;
            before(() => {
                firstFunction = middleware();
                secondFunction = middleware();
            });
            it('should not return the same middleware function', () => {
                expect(firstFunction).to.not.equal(secondFunction);
            });
            it('should have http_request_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_request_duration_seconds with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code']);
            });
            it('should have http_response_size_bytes with the right labels', () => {
                expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
            });
            after(() => {
                Prometheus.register.clear();
            });
        });
        describe('when using middleware request baseUrl is undefined', function () {
            let func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                delete req.baseUrl;
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, {
                    method: 'GET',
                    route: '/path',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/path',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                responseTimeObserve.restore();
            });
        });
        describe('when using middleware request baseUrl is undefined and path is not "/"', function () {
            let func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path/:id',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                delete req.baseUrl;
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, _matchedRoute: '/path/:id' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, {
                    method: 'GET',
                    route: '/path/:id',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/path/:id',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                responseTimeObserve.restore();
            });
        });
        describe('when using middleware request and route is with sub routing', function () {
            let match, func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                match = sinon.stub().returns({ path: [{ path: '/path/:id' }] });
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path/:id',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                delete req.baseUrl;
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, router: { match: match }, _matchedRoute: '/v1(.*)', originalUrl: '/v1/path/123' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, {
                    method: 'GET',
                    route: '/v1/path/:id',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/v1/path/:id',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                responseTimeObserve.restore();
            });
        });
        describe('when using middleware request and route is with sub routing, first path is with place holder', function () {
            let match, func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                match = sinon.stub().returns({ path: [{ path: '/v1(.*)' }, { path: '/path/:id' }] });
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path/:id',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                delete req.baseUrl;
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, router: { match: match }, _matchedRoute: '/v1(.*)', originalUrl: '/v1/path/123' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, {
                    method: 'GET',
                    route: '/v1/path/:id',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/v1/path/:id',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                responseTimeObserve.restore();
            });
        });
        describe('when using middleware request and route is with sub routing, regex of path with base path', function () {
            let match, func, req, res, ctx, next, requestSizeObserve, responseTimeObserve, endTimerStub;
            before(() => {
                match = sinon.stub();
                match.onFirstCall().returns({ path: [] });
                match.onSecondCall().returns({ path: [{ path: '/v1(.*)' }, { path: '/v1/path/:id' }] });
                next = sinon.stub();
                req = httpMocks.createRequest({
                    url: '/path/:id',
                    method: 'GET',
                    body: {
                        foo: 'bar'
                    },
                    headers: {
                        'content-length': '25'
                    }
                });
                req.socket = {};
                res = httpMocks.createResponse({
                    eventEmitter: EventEmitter
                });
                delete req.baseUrl;
                res.statusCode = 200;
                ctx = { req: req, res: res, request: req, response: res, router: { match: match }, _matchedRoute: '/v1(.*)', originalUrl: '/v1/path/123' };
                func = middleware();
                endTimerStub = sinon.stub();
                responseTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
                func(ctx, next);
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, {
                    method: 'GET',
                    route: '/v1/path/:id',
                    code: 200
                }, 25);
                sinon.assert.calledWith(responseTimeObserve, {
                    method: 'GET'
                });
                sinon.assert.calledWith(endTimerStub, {
                    route: '/v1/path/:id',
                    code: 200
                });
                sinon.assert.calledOnce(responseTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                responseTimeObserve.restore();
            });
        });
        describe('when _getConnections called', function () {
            let Middleware, server, numberOfConnectionsGauge, koaMiddleware, promethusStub;
            before(function () {
                Middleware = require('../../src/koa-middleware');
                server = {
                    getConnections: sinon.stub()
                };
            });
            describe('when there is no server', function () {
                before(function () {
                    const koaMiddleware = new Middleware({});
                    koaMiddleware._getConnections();
                });
                it('should not call getConnections', function () {
                    sinon.assert.notCalled(server.getConnections);
                });
            });
            describe('when there is server', function () {
                after(function () {
                    promethusStub.restore();
                });
                afterEach(function () {
                    numberOfConnectionsGauge.set.resetHistory();
                });
                before(function () {
                    numberOfConnectionsGauge = {
                        set: sinon.stub()
                    };
                    promethusStub = sinon.stub(Prometheus.register, 'getSingleMetric').returns(numberOfConnectionsGauge);
                });
                describe('when getConnections return count', function () {
                    before(function () {
                        server.getConnections = sinon.stub().yields(null, 1);
                        koaMiddleware = new Middleware({ server: server, numberOfConnectionsGauge: numberOfConnectionsGauge });
                        koaMiddleware._collectDefaultServerMetrics(1000);
                    });
                    it('should call numberOfConnectionsGauge.set with count', function (done) {
                        setTimeout(() => {
                            sinon.assert.calledOnce(server.getConnections);
                            sinon.assert.calledOnce(numberOfConnectionsGauge.set);
                            sinon.assert.calledWith(numberOfConnectionsGauge.set, 1);
                            done();
                        }, 1100);
                    });
                });
                describe('when getConnections return count', function () {
                    before(function () {
                        server.getConnections = sinon.stub().reset();
                        server.getConnections = sinon.stub().yields(new Error('error'));
                        koaMiddleware = new Middleware({ server: server, numberOfConnectionsGauge: numberOfConnectionsGauge });
                        koaMiddleware._collectDefaultServerMetrics(500);
                    });
                    it('should not call numberOfConnectionsGauge.set with count', function (done) {
                        setTimeout(() => {
                            sinon.assert.calledOnce(server.getConnections);
                            sinon.assert.notCalled(numberOfConnectionsGauge.set);
                            done();
                        }, 510);
                    });
                });
            });
        });
    });
});
