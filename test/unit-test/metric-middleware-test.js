'use strict';

const Prometheus = require('prom-client');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');
const middleware = rewire('../../src/metrics-middleware')('1.0.0');
const httpMocks = require('node-mocks-http');
const EventEmitter = require('events').EventEmitter;
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('metrics-middleware', () => {
    after(() => {
        Prometheus.register.clear();
    });
    describe('when calling the function with options', () => {
        before(async () => {
            await middleware({
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
        before(async () => {
            await middleware({
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
        before(async () => {
            await middleware({
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
        before(async () => {
            await middleware();
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
        let func, req, res, next, requestSizeObserve, requestTimeObserve, endTimerStub;
        before(async () => {
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
            req.socket = {};
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = await middleware();
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
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
                sinon.assert.called(requestTimeObserve);
                sinon.assert.calledWith(endTimerStub, {
                    method: 'GET',
                    route: '/path',
                    code: 200
                });
                sinon.assert.calledOnce(requestTimeObserve);
                sinon.assert.calledOnce(endTimerStub);
            });
            after(() => {
                requestSizeObserve.restore();
                requestTimeObserve.restore();
            });
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when using the middleware request has\'t body', () => {
        let func, req, res, next, requestTimeObserve, requestSizeObserve, endTimerStub;
        before(async () => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/:id'
            };
            req.socket = {};
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = await middleware();
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
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
                sinon.assert.called(requestTimeObserve);
                sinon.assert.calledWith(endTimerStub, {
                    method: 'GET',
                    route: '/path/:id',
                    code: 200
                });
                sinon.assert.calledOnce(endTimerStub);
                sinon.assert.calledOnce(requestTimeObserve);
            });
            after(() => {
                requestSizeObserve.restore();
                requestTimeObserve.restore();
            });
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when using the middleware response has body', () => {
        let func, req, res, next, responseSizeObserve, requestTimeObserve, endTimerStub;
        before(async () => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/'
            };
            req.socket = {};
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            res._headers = {
                'content-length': '25'
            };
            func = await middleware();
            responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(responseSizeObserve, {
                method: 'GET',
                route: '/path',
                code: 200
            }, 25);
            sinon.assert.called(requestTimeObserve);
            sinon.assert.calledWith(endTimerStub, {
                method: 'GET',
                route: '/path',
                code: 200
            });
            sinon.assert.calledOnce(requestTimeObserve);
            sinon.assert.calledOnce(endTimerStub);
        });
        after(() => {
            responseSizeObserve.restore();
            requestTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('when using the middleware response has\'t body', () => {
        let func, req, res, next, responseSizeObserve, requestTimeObserve, endTimerStub;
        before(async () => {
            next = sinon.stub();
            req = httpMocks.createRequest({
                url: '/path',
                method: 'GET'
            });
            req.route = {
                path: '/'
            };
            req.socket = {};
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            res.statusCode = 200;
            func = await middleware();
            endTimerStub = sinon.stub();
            responseSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_response_size_bytes'), 'observe');
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(responseSizeObserve, {
                method: 'GET',
                route: '/path',
                code: 200
            }, 0);
            sinon.assert.called(requestTimeObserve);
            sinon.assert.calledWith(endTimerStub, {
                method: 'GET',
                route: '/path',
                code: 200
            });
            sinon.assert.calledOnce(requestTimeObserve);
            sinon.assert.calledOnce(endTimerStub);
        });
        after(() => {
            responseSizeObserve.restore();
            requestTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('override the default path', () => {
        let func;
        beforeEach(async () => {
            func = await middleware({
                metricsPath: '/v1/metrics'
            });
        });
        it('should set the updated route', async () => {
            const end = sinon.stub();
            const set = sinon.stub();
            await func({
                url: '/v1/metrics'
            }, {
                end: end,
                set: set
            });
            sinon.assert.calledOnce(end);
            // eslint-disable-next-line no-control-regex
            const endFormalized = end.getCall(0).args[0].replace(/ ([0-9]*[.])?[0-9]+[\x0a]/g, ' #num\n');
            // eslint-disable-next-line no-control-regex
            const apiFormalized = (await Prometheus.register.metrics()).replace(/ ([0-9]*[.])?[0-9]+[\x0a]/g, ' #num\n');
            expect(endFormalized).to.eql(apiFormalized);
            sinon.assert.calledWith(set, 'Content-Type', Prometheus.register.contentType);
            sinon.assert.calledOnce(set);
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when initialize the middleware twice', () => {
        let firstFunction, secondFunction;
        before(async () => {
            firstFunction = await middleware();
        });
        it('should throw error if metric already registered', async () => {
            expect((async () => { secondFunction = await middleware() })()).to.be.rejectedWith('A metric with the name process_cpu_user_seconds_total has already been registered');
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
    describe('when using middleware request baseUrl is undefined', () => {
        let func, req, res, next, requestSizeObserve, requestTimeObserve, endTimerStub;
        before(async () => {
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
            req.route = {
                path: '/'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            delete req.baseUrl;
            res.statusCode = 200;
            func = await middleware();
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
            requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(requestSizeObserve, {
                method: 'GET',
                route: '/path',
                code: 200
            }, 25);
            sinon.assert.called(requestTimeObserve);
            sinon.assert.calledWith(endTimerStub, {
                method: 'GET',
                route: '/path',
                code: 200
            });
            sinon.assert.calledOnce(requestTimeObserve);
            sinon.assert.calledOnce(endTimerStub);
        });
        after(() => {
            requestSizeObserve.restore();
            requestTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('when using middleware request baseUrl is undefined and path is not "/"', () => {
        let func, req, res, next, requestSizeObserve, requestTimeObserve, endTimerStub;
        before(async () => {
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
            req.route = {
                path: '/:id'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            delete req.baseUrl;
            res.statusCode = 200;
            func = await middleware();
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
            requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
            res.emit('finish');
        });
        it('should update the histogram with the elapsed time and size', () => {
            sinon.assert.calledWithExactly(requestSizeObserve, {
                method: 'GET',
                route: '/path/:id',
                code: 200
            }, 25);
            sinon.assert.called(requestTimeObserve);
            sinon.assert.calledWith(endTimerStub, {
                method: 'GET',
                route: '/path/:id',
                code: 200
            });
            sinon.assert.calledOnce(requestTimeObserve);
            sinon.assert.calledOnce(endTimerStub);
        });
        after(() => {
            requestSizeObserve.restore();
            requestTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('when _getConnections called', () => {
        let Middleware, server, numberOfConnectionsGauge, expressMiddleware, prometheusStub;
        before(() => {
            Middleware = require('../../src/express-middleware');
            server = {
                getConnections: sinon.stub()
            };
        });
        describe('when there is no server', () => {
            before(() => {
                const expressMiddleware = new Middleware({});
                expressMiddleware._getConnections();
            });
            it('should not call getConnections', () => {
                sinon.assert.notCalled(server.getConnections);
            });
        });
        describe('when there is server', () => {
            after(() => {
                prometheusStub.restore();
            });
            afterEach(() => {
                numberOfConnectionsGauge.set.resetHistory();
            });
            before(() => {
                numberOfConnectionsGauge = {
                    set: sinon.stub()
                };
                prometheusStub = sinon.stub(Prometheus.register, 'getSingleMetric').returns(numberOfConnectionsGauge);
            });
            describe('when getConnections return count', () => {
                before(() => {
                    server.getConnections = sinon.stub().yields(null, 1);
                    expressMiddleware = new Middleware({ server: server, numberOfConnectionsGauge: numberOfConnectionsGauge });
                    expressMiddleware._collectDefaultServerMetrics(1000);
                });
                it('should call numberOfConnectionsGauge.set with count', (done) => {
                    setTimeout(() => {
                        sinon.assert.calledOnce(server.getConnections);
                        sinon.assert.calledOnce(numberOfConnectionsGauge.set);
                        sinon.assert.calledWith(numberOfConnectionsGauge.set, 1);
                        done();
                    }, 1100);
                });
            });
            describe('when getConnections return count', () => {
                before(() => {
                    server.getConnections = sinon.stub().yields(new Error('error'));
                    expressMiddleware = new Middleware({ server: server, numberOfConnectionsGauge: numberOfConnectionsGauge });
                    expressMiddleware._collectDefaultServerMetrics(500);
                });
                it('should not call numberOfConnectionsGauge.set with count', (done) => {
                    setTimeout(() => {
                        sinon.assert.calledOnce(server.getConnections);
                        sinon.assert.notCalled(numberOfConnectionsGauge.set);
                        done();
                    }, 510);
                });
            });
        });
    });
    describe('when calling the function with additionalLabels option', () => {
        before(() => {
            middleware({
                additionalLabels: ['label1', 'label2']
            });
        });
        it('should have http_request_duration_seconds with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_duration_seconds').labelNames).to.have.members(['method', 'route', 'code', 'label1', 'label2']);
        });
        it('should have http_request_size_bytes with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code', 'label1', 'label2']);
        });
        it('should have http_response_size_bytes with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes').labelNames).to.have.members(['method', 'route', 'code', 'label1', 'label2']);
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when using the middleware with additionalLabels options', () => {
        let func, req, res, next, requestSizeObserve, requestTimeObserve, endTimerStub;
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
            req.route = {
                path: '/:id'
            };
            res = httpMocks.createResponse({
                eventEmitter: EventEmitter
            });
            delete req.baseUrl;
            res.statusCode = 200;
            func = middleware({
                additionalLabels: ['label1', 'label2'],
                extractAdditionalLabelValuesFn: () => ({ label1: 'valueLabel1', label2: 'valueLabel2' })
            });
            endTimerStub = sinon.stub();
            requestTimeObserve = sinon.stub(Prometheus.register.getSingleMetric('http_request_duration_seconds'), 'startTimer').returns(endTimerStub);
            func(req, res, next);
            requestSizeObserve = sinon.spy(Prometheus.register.getSingleMetric('http_request_size_bytes'), 'observe');
            res.emit('finish');
        });
        it('metrics should include additional metrics', () => {
            sinon.assert.calledWithExactly(requestSizeObserve, {
                label1: 'valueLabel1',
                label2: 'valueLabel2',
                method: 'GET',
                route: '/path/:id',
                code: 200
            }, 25);
            sinon.assert.called(requestTimeObserve);
            sinon.assert.calledWith(endTimerStub, {
                label1: 'valueLabel1',
                label2: 'valueLabel2',
                method: 'GET',
                route: '/path/:id',
                code: 200
            });
            sinon.assert.calledOnce(requestTimeObserve);
            sinon.assert.calledOnce(endTimerStub);
        });
        after(() => {
            requestSizeObserve.restore();
            requestTimeObserve.restore();
            Prometheus.register.clear();
        });
    });
    describe('when calling the function with excludeDefaultMetricLabels option', () => {
        it('or it\'s undefined', () => {
            middleware();
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('and it\'s false', () => {
            middleware({
                excludeDefaultMetricLabels: false
            });
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('and it\'s true', () => {
            middleware({
                excludeDefaultMetricLabels: true
            });
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members([]);
        });
        it('and it\'s an array', () => {
            middleware({
                excludeDefaultMetricLabels: ['route', 'code']
            });
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes').labelNames).to.have.members(['method']);
        });
        it('and it\'s other type', () => {
            expect(() => {
                middleware({
                    excludeDefaultMetricLabels: 'invalid',
                });
            }).to.throw('excludeDefaultMetricLabels should be an array or a boolean');
        });
        afterEach(() => {
            Prometheus.register.clear();
        });
    });
    describe('when calling the function with useCountersForRequestSizeMetric option', () => {
        before(() => {
            middleware({
                useCountersForRequestSizeMetric: true
            });
        });
        it('shouldn\'t have http_request_size_bytes metric', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes')).to.equal(undefined);
        });
        it('should have http_request_size_bytes_sum with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes_sum').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('should have http_request_size_bytes_count with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_request_size_bytes_count').labelNames).to.have.members(['method', 'route', 'code']);
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
    describe('when calling the function with useCountersForResponseSizeMetric option', () => {
        before(() => {
            middleware({
                useCountersForResponseSizeMetric: true
            });
        });
        it('shouldn\'t have http_response_size_bytes metric', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes')).to.equal(undefined);
        });
        it('should have http_response_size_bytes_sum with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes_sum').labelNames).to.have.members(['method', 'route', 'code']);
        });
        it('should have http_response_size_bytes_count with the right labels', () => {
            expect(Prometheus.register.getSingleMetric('http_response_size_bytes_count').labelNames).to.have.members(['method', 'route', 'code']);
        });
        after(() => {
            Prometheus.register.clear();
        });
    });
});
