'use strict';
const { expect } = require('chai');
const Prometheus = require('prom-client');
const supertest = require('supertest');

let app, config;

describe('when using express framework (default route)', function() {
    this.timeout(4000);
    before(() => {
        config = require('./server/config');
        config.useUniqueHistogramName = true;
        app = require('./server/express-server-default-route');
    });
    after(() => {
        Prometheus.register.clear();
        delete require.cache[require.resolve('./server/express-server-default-route.js')];
        delete require.cache[require.resolve('../../../src/index.js')];
        delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
    });

    describe('when start up with default route', () => {
        describe('when calling default endpoint', () => {
            before(() => {
                return supertest(app)
                    .get('/dne')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="*",code="200"');
                    });
            });
        });

        describe('when calling existing GET endpoint', () => {
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
                        expect(res.text).to.contain('method="GET",route="*",code="200"');
                    });
            });
        });
    });
});
