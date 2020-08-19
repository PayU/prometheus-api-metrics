'use strict';
const Prometheus = require('prom-client');
const expect = require('chai').expect;
const supertest = require('supertest');
let app, config;

describe('when using koa framework with unique metric names', () => {
    before(() => {
        config = require('./server/config');
        config.useUniqueHistogramName = true;
        app = require('./server/koa-server');
        app = app.listen(3000);
    });
    after(() => {
        app.close();
        Prometheus.register.clear();

        delete require.cache[require.resolve('./server/koa-server')];
        delete require.cache[require.resolve('../../../src/index.js')];
        delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
    });
    describe('when start up with unique metric names', () => {
        it('should populate default metrics', () => {
            return supertest(app)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('koa_test_process_cpu_user_seconds_total');
                    expect(res.text).to.contain('koa_test_process_cpu_system_seconds_total');
                    expect(res.text).to.contain('koa_test_process_cpu_seconds_total');
                    expect(res.text).to.contain('koa_test_process_start_time_seconds');
                    expect(res.text).to.contain('koa_test_process_resident_memory_bytes');
                    expect(res.text).to.contain('koa_test_nodejs_eventloop_lag_seconds');

                    expect(res.text).to.contain('koa_test_nodejs_active_handles_total');
                    expect(res.text).to.contain('koa_test_nodejs_active_requests_total');

                    expect(res.text).to.contain('koa_test_nodejs_heap_size_total_bytes');
                    expect(res.text).to.contain('koa_test_nodejs_heap_size_used_bytes');
                    expect(res.text).to.contain('koa_test_nodejs_external_memory_bytes');

                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_total_bytes{space="new"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_total_bytes{space="old"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_total_bytes{space="code"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_total_bytes{space="map"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_total_bytes{space="large_object"}');

                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_used_bytes{space="new"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_used_bytes{space="old"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_used_bytes{space="code"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_used_bytes{space="map"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_used_bytes{space="large_object"}');

                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_available_bytes{space="new"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_available_bytes{space="old"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_available_bytes{space="code"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_available_bytes{space="map"}');
                    expect(res.text).to.contain('koa_test_nodejs_heap_space_size_available_bytes{space="large_object"}');

                    expect(res.text).to.contain('koa_test_nodejs_version_info');
                    expect(res.text).to.contain('koa_test_app_version{version="1.0.0",major="1",minor="0",patch="0"}');
                });
        });
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
                        expect(res.text).to.contain('koa_test');
                    });
            });
        });
    });
});
