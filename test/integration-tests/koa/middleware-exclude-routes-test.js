'use strict';
const Prometheus = require('prom-client');
const expect = require('chai').expect;
const supertest = require('supertest');
let app, config;

describe('when using koa framework (exclude routes)', () => {
    before(() => {
        Prometheus.register.clear();
        config = require('./server/config');
        config.useUniqueHistogramName = true;
        app = require('./server/koa-server-exclude-routes');
        app = app.listen(3000);
    });
    after(() => {
        app.close();
        Prometheus.register.clear();

        delete require.cache[require.resolve('./server/koa-server-exclude-routes.js')];
        delete require.cache[require.resolve('../../../src/index.js')];
        delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
    });
    describe('when start up with exclude route', () => {
        describe('when calling a GET endpoint', () => {
            before(() => {
                return supertest(app)
                    .get('/hello')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/hello",code="200"');
                    });
            });
        });
        describe('when calling a GET endpoint of excluded path', () => {
            before(() => {
                return supertest(app)
                    .get('/health')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.not.contain('method="GET",route="/health",code="200"');
                    });
            });
        });
        describe('when calling a GET endpoint of excluded path with variables', () => {
            before(() => {
                return supertest(app)
                    .get('/health/1234')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.not.contain('method="GET",route="/health/:id",code="200"');
                    });
            });
        });
    });
    describe('when start up with include query params', () => {
        describe('when calling a GET endpoint with one query param', () => {
            before(() => {
                return supertest(app)
                    .get('/hello?test=test')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/hello?test=<?>",code="200"');
                    });
            });
        });
        describe('when calling a GET endpoint with two query params', () => {
            before(() => {
                return supertest(app)
                    .get('/hello?test1=test&test2=test2')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram and sort the query params', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('http_request_duration_seconds_count{method="GET",route="/hello?test1=<?>&test2=<?>",code="200"} 1');
                    });
            });
        });
        describe('when calling a GET endpoint with two query params in different order', () => {
            before(() => {
                return supertest(app)
                    .get('/hello?test2=test&test1=test2')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram and sort the query params', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('http_request_duration_seconds_count{method="GET",route="/hello?test1=<?>&test2=<?>",code="200"} 2');
                    });
            });
        });
        describe('when calling a GET endpoint with query param', () => {
            before(() => {
                return supertest(app)
                    .get('/health/1234?test=test')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.not.contain('method="GET",route="/health/:id?test=<?>",code="200"');
                    });
            });
        });
        describe('when calling a GET root endpoint with query param ', () => {
            before(() => {
                return supertest(app)
                    .get('/?test=test')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('http_request_size_bytes_count{method="GET",route="/?test=<?>",code="200"} 1');
                    });
            });
        });
    });
});
