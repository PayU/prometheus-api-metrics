'use strict';

const Prometheus = require('prom-client');
const sinon = require('sinon');
const expect = require('chai').expect;
const rewire = require('rewire');
const middleware = rewire('../../src/metrics-middleware');
// const middleware = require('../../src/metrics-middleware')
const httpMocks = require('node-mocks-http');
const EventEmitter = require('events').EventEmitter;

describe('metrics-middleware', () => {
    describe('when calling the function with options', () => {
        before(() => {
            middleware({
                durationBuckets: [1, 10, 50, 100, 300, 500, 1000],
                requestSizeBuckets: [0, 1, 5, 10, 15],
                responseSizeBuckets: [250, 500, 1000, 2500, 5000, 10000, 15000, 20000]
            });
        });
        it('should have http_request_size_bytes metrics with default buckets', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').bucketValues).to.have.all.keys([0, 1, 5, 10, 15]);
        });
        it('should have http_request_size_bytes with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('should have http_request_duration_ms metrics with default buckets', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_ms').bucketValues).to.have.all.keys([1, 10, 50, 100, 300, 500, 1000]);
        });
        it('should have http_request_duration_ms with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_ms').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('should have http_response_size_bytes metrics with default buckets', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes').bucketValues).to.have.all.keys([250, 500, 1000, 2500, 5000, 10000, 15000, 20000]);
        });
        it('should have http_response_size_bytes with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
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
        it('should have http_request_duration_ms metrics with default buckets', () => {
            expect(Object.keys(Prometheus.register.getSingleMetric('http_request_duration_ms').bucketValues)).to.have.lengthOf(0);
        });
        it('should have http_request_duration_ms with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_ms').labelNames).to.have.members(['method', 'route', 'code']);
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
        it('should have http_request_duration_ms metrics with default buckets', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_ms').bucketValues).to.have.all.keys([0.10, 5, 15, 50, 100, 200, 300, 400, 500]);
        });
        it('should have http_request_duration_ms with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_ms').labelNames).to.have.members(['method', 'route', 'code']);
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
        let func, req, res, next;
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
            req.route = {
                path: '/'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = middleware();
            func(req, res, next);
        });
        it('should save the request size and start time on the request', () => {
            expect(req.metrics.startEpoch).to.exist;
            expect(req.metrics.contentLength).to.equal(25);
        });
        it('should call next', () => {
            sinon.assert.calledOnce(next);
        });
        describe('when the request ends', () => {
            let requestSizeObserve, responseTimeObserve;
            before(() => {
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                responseTimeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_duration_ms'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, { method: 'GET', route: '/path', code: 200 }, 25);
                sinon.assert.calledWith(responseTimeObserve, { method: 'GET', route: '/path', code: 200 });
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
    describe('when using the middleware request has\'t body', () => {
        let func, req, res, next;
        before(() => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/:id'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = middleware();
            func(req, res, next);
        });
        it('should save the request size and start time on the request', () => {
            expect(req.metrics.startEpoch).to.exist;
            expect(req.metrics.contentLength).to.equal(0);
        });
        it('should call next', () => {
            sinon.assert.calledOnce(next);
        });
        describe('when the request ends', () => {
            let requestSizeObserve, responseTimeObserve;
            before(() => {
                requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
                responseTimeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_duration_ms'), 'observe');
                res.emit('finish');
            });
            it('should update the histogram with the elapsed time and size', () => {
                sinon.assert.calledWithExactly(requestSizeObserve, { method: 'GET', route: '/path/:id', code: 200 }, 0);
                sinon.assert.calledWith(responseTimeObserve, { method: 'GET', route: '/path/:id', code: 200 });
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
        let func, req, res, next, responseSizeObserve, responseTimeObserve;
        before(() => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            res._headers = {
                'content-length': '25'
            };
            func = middleware();
            func(req, res, next);
            responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
            responseTimeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_duration_ms'), 'observe');
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(responseSizeObserve, { method: 'GET', route: '/path', code: 200 }, 25);
            sinon.assert.calledWith(responseTimeObserve, { method: 'GET', route: '/path', code: 200 });
            sinon.assert.calledOnce(responseTimeObserve);
        });
        after(() => {
            responseSizeObserve.restore();
            responseTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('when using the middleware response has\'t body', () => {
        let func, req, res, next, responseSizeObserve, responseTimeObserve;
        before(() => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = middleware();
            func(req, res, next);
            responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
            responseTimeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_duration_ms'), 'observe');
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(responseSizeObserve, { method: 'GET', route: '/path', code: 200 }, 0);
            sinon.assert.calledWith(responseTimeObserve, { method: 'GET', route: '/path', code: 200 });
            sinon.assert.calledOnce(responseTimeObserve);
        });
        after(() => {
            responseSizeObserve.restore();
            responseTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('override the default path', function () {
        beforeEach(() => {
            middleware({
                metricsPath: '/v1/metrics'
            });
        });
        it('should set the updated route', () => {
            expect(middleware.__get__('route')).to.equal('/v1/metrics');
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when calling on exit', () => {
        let clearMetricsIntervalSpy;
        beforeEach(() => {
            const middleware = rewire('../../src/metrics-middleware');
            clearMetricsIntervalSpy = sinon.spy(middleware.__get__('_clearDefaultMetricsInternal'));
            middleware.__set__('_clearDefaultMetricsInternal', clearMetricsIntervalSpy);
            middleware();
            process.emit('exit');
        });
        it('should clear the default metrics interval', () => {
            sinon.assert.calledOnce(clearMetricsIntervalSpy);
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
});
