'use strict';

const expect = require('chai').expect;
const supertest = require('supertest');
const app = require('./server/express-server');

describe('when using express framework', () => {
    describe('when start up', () => {
        it('should populate default metrics', () => {
            return supertest(app)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('process_cpu_user_seconds_total');
                    expect(res.text).to.contain('process_cpu_system_seconds_total');
                    expect(res.text).to.contain('process_cpu_seconds_total');
                    expect(res.text).to.contain('process_start_time_seconds');
                    expect(res.text).to.contain('process_resident_memory_bytes');
                    expect(res.text).to.contain('nodejs_eventloop_lag_seconds');

                    expect(res.text).to.contain('nodejs_active_handles_total');
                    expect(res.text).to.contain('nodejs_active_requests_total');

                    expect(res.text).to.contain('nodejs_heap_size_total_bytes');
                    expect(res.text).to.contain('nodejs_heap_size_used_bytes');
                    expect(res.text).to.contain('nodejs_external_memory_bytes');

                    expect(res.text).to.contain('nodejs_heap_space_size_total_bytes{space="new"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_total_bytes{space="old"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_total_bytes{space="code"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_total_bytes{space="map"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_total_bytes{space="large_object"}');

                    expect(res.text).to.contain('nodejs_heap_space_size_used_bytes{space="new"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_used_bytes{space="old"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_used_bytes{space="code"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_used_bytes{space="map"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_used_bytes{space="large_object"}');

                    expect(res.text).to.contain('nodejs_heap_space_size_available_bytes{space="new"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_available_bytes{space="old"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_available_bytes{space="code"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_available_bytes{space="map"}');
                    expect(res.text).to.contain('nodejs_heap_space_size_available_bytes{space="large_object"}');

                    expect(res.text).to.contain('nodejs_version_info');
                    expect(res.text).to.contain('app_version{version="1.0.0",major="1",minor="0",patch="0"}');
                });
        });
        describe('when calling a GET endpoint', function () {
            before(() => {
                return supertest(app)
                    .get('/hello')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', function () {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/hello",code="200"');
                    });
            });
        });
        describe('when calling a GET endpoint with path params', function () {
            before(() => {
                return supertest(app)
                    .get('/hello/200')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', function () {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/hello/:time",code="200"');
                    });
            });
        });
        describe('when calling a POST endpoint', function () {
            before(() => {
                return supertest(app)
                    .post('/test')
                    .send({name: 'john'})
                    .set('Accept', 'application/json')
                    .expect(201)
                    .then((res) => {});
            });
            it('should add it to the histogram', function () {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="POST",route="/test",code="201"');
                    });
            });
        });
        describe('when calling endpoint and getting an error', function () {
            before(() => {
                return supertest(app)
                    .get('/bad')
                    .expect(500)
                    .then((res) => {});
            });
            it('should add it to the histogram', function () {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/bad",code="500"');
                    });
            });
        });
        describe('when using custom metrics', function () {
            before(() => {
                return supertest(app)
                    .get('/checkout')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', function () {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('checkouts_total');
                    });
            });
        });
        it('should get metrics as json', function () {
            return supertest(app)
                .get('/metrics.json')
                .expect(200)
                .then((res) => {
                    JSON.parse(res.text);
                });
        });
        after(function () {
            const Prometheus = require('prom-client');
            Prometheus.register.clear();
        });
    });
});