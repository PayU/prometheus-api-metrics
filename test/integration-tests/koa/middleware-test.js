'use strict';
const Prometheus = require('prom-client');
const expect = require('chai').expect;
const supertest = require('supertest');
let app, config;

describe('when using koa framework', () => {
    before(() => {
        app = require('./server/koa-server');
        app = app.listen(3000);
        config = require('./server/config');
    });
    after(() => {
        app.close();
        Prometheus.register.clear();

        delete require.cache[require.resolve('./server/koa-server')];
        delete require.cache[require.resolve('../../../src/index.js')];
        delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
    });
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
        describe('when calling a GET endpoint', () => {
            before(() => {
                return supertest(app)
                    .get('/hello')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add number of open connections', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('koajs_number_of_open_connections');
                    });
            });
        });
        describe('when calling a GET endpoint with path params', () => {
            before(() => {
                return supertest(app)
                    .get('/hello/200')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/hello/:time",code="200"} 1');
                        expect(res.text).to.contain('http_response_size_bytes_bucket{le="+Inf",method="GET",route="/hello/:time",code="200"} 1');
                        expect(res.text).to.contain('http_request_size_bytes_bucket{le="+Inf",method="GET",route="/hello/:time",code="200"} 1');
                    });
            });
        });
        describe('when calling a POST endpoint', () => {
            before(() => {
                return supertest(app)
                    .post('/test')
                    .send({name: 'john'})
                    .set('Accept', 'application/json')
                    .expect(201)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="POST",route="/test",code="201"');
                    });
            });
        });
        describe('when calling endpoint and getting an error', () => {
            before(() => {
                return supertest(app)
                    .get('/bad')
                    .expect(500)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="/bad",code="500"');
                    });
            });
        });
        describe('when calling a GET endpoint with query parmas', () => {
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
                        expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/hello",code="200"} 3');
                    });
            });
        });
        describe('sub app', function () {
            describe('when calling a GET endpoint with path params', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/hello/200')
                        .expect(200)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_response_size_bytes_bucket{le="+Inf",method="GET",route="/v2/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_request_size_bytes_bucket{le="+Inf",method="GET",route="/v2/hello/:time",code="200"} 1');
                        });
                });
            });
            describe('when calling a POST endpoint', () => {
                before(() => {
                    return supertest(app)
                        .post('/v2/test')
                        .send({name: 'john'})
                        .set('Accept', 'application/json')
                        .expect(201)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="POST",route="/v2/test",code="201"');
                        });
                });
            });
            describe('when calling endpoint and getting an error only variables', () => {
                before(() => {
                    return supertest(app)
                        .patch('/v2/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="PATCH",route="/v2/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with 1 variable', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/bad/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/bad/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with two variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/bad/500/400')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/bad/:var1/:var2",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with no variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/bad')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/bad",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error (root)', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error (error handler in the sub app)', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/error/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/error/:var1",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error from a middleware before sub route', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/hello')
                        .set('error', 'error')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2",code="500"');
                        });
                });
            });
            describe('when calling a GET endpoint with query parmas', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2?test=test')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2",code="500"} 2');
                        });
                });
            });
        });
        describe('sub-sub app with error handler in the sub app', function () {
            describe('when calling a GET endpoint with path params and sub router', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3/hello/200/')
                        .expect(200)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2/v3/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_response_size_bytes_bucket{le="+Inf",method="GET",route="/v2/v3/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_request_size_bytes_bucket{le="+Inf",method="GET",route="/v2/v3/hello/:time",code="200"} 1');
                        });
                });
            });
            describe('when calling a POST endpoint with sub router', () => {
                before(() => {
                    return supertest(app)
                        .post('/v2/v3/test')
                        .send({name: 'john'})
                        .set('Accept', 'application/json')
                        .expect(201)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="POST",route="/v2/v3/test",code="201"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router only variables', () => {
                before(() => {
                    return supertest(app)
                        .patch('/v2/v3/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="PATCH",route="/v2/v3/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with 1 variable', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3/bad/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v3/bad/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with two variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3/bad/500/400')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v3/bad/:var1/:var2",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with no variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3/bad')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v3/bad",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router (root)', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v3",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error from a middleware before sub route', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3/hello')
                        .set('error', 'error')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v3",code="500"');
                        });
                });
            });
            describe('when calling a GET endpoint with query parmas', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v3?test=test')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2/v3",code="500"} 2');
                        });
                });
            });
        });
        describe('sub-sub app with error handler in the sub-sub app', function () {
            describe('when calling a GET endpoint with path params and sub router', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4/hello/200')
                        .expect(200)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2/v4/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_response_size_bytes_bucket{le="+Inf",method="GET",route="/v2/v4/hello/:time",code="200"} 1');
                            expect(res.text).to.contain('http_request_size_bytes_bucket{le="+Inf",method="GET",route="/v2/v4/hello/:time",code="200"} 1');
                        });
                });
            });
            describe('when calling a POST endpoint with sub router', () => {
                before(() => {
                    return supertest(app)
                        .post('/v2/v4/test')
                        .send({name: 'john'})
                        .set('Accept', 'application/json')
                        .expect(201)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="POST",route="/v2/v4/test",code="201"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router only variables', () => {
                before(() => {
                    return supertest(app)
                        .patch('/v2/v4/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="PATCH",route="/v2/v4/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with 1 variable', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4/bad/500')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v4/bad/:time",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with two variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4/bad/500/400')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v4/bad/:var1/:var2",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router with no variables', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4/bad')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v4/bad",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error with sub router (root)', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v4",code="500"');
                        });
                });
            });
            describe('when calling endpoint and getting an error from a middleware before sub route', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4/hello')
                        .set('error', 'error')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('method="GET",route="/v2/v4",code="500"');
                        });
                });
            });
            describe('when calling a GET endpoint with query parmas', () => {
                before(() => {
                    return supertest(app)
                        .get('/v2/v4?test=test')
                        .expect(500)
                        .then((res) => {});
                });
                it('should add it to the histogram', () => {
                    return supertest(app)
                        .get('/metrics')
                        .expect(200)
                        .then((res) => {
                            expect(res.text).to.contain('http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/v2/v4",code="500"} 2');
                        });
                });
            });
        });
        describe('when calling endpoint and getting an error from a middleware before route', () => {
            before(() => {
                return supertest(app)
                    .get('/hello')
                    .set('error', 'error')
                    .expect(500)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="N/A",code="500"');
                    });
            });
        });
        describe('when using custom metrics', () => {
            before(() => {
                return supertest(app)
                    .get('/checkout')
                    .expect(200)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('checkouts_total');
                    });
            });
        });
        describe('when calling not existing endpoint', function() {
            before(() => {
                let notExistingPath = '/notExistingPath' + Math.floor(Math.random() * 10);
                return supertest(app)
                    .get(notExistingPath)
                    .expect(404)
                    .then((res) => {});
            });
            it('should add it to the histogram', () => {
                return supertest(app)
                    .get('/metrics')
                    .expect(200)
                    .then((res) => {
                        expect(res.text).to.contain('method="GET",route="N/A",code="404"');
                    });
            });
        });
        it('should get metrics as json', () => {
            return supertest(app)
                .get('/metrics.json')
                .expect(200)
                .then((res) => {
                    JSON.parse(res.text);
                });
        });
    });
    describe('when start up with unique metric names', () => {
        before(() => {
            app.close();
            config.useUniqueHistogramName = true;
            delete require.cache[require.resolve('./server/koa-server')];
            delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
            app = require('./server/koa-server');
            app = app.listen(3000);
        });
        // after(() => {
        //     app.close();
        // });
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
    describe('when start up with exclude route', () => {
        before(() => {
            app.close();
            config.useUniqueHistogramName = true;
            delete require.cache[require.resolve('./server/koa-server')];
            delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
            app = require('./server/koa-server-exclude-routes');
            app = app.listen(3000);
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
        before(() => {
            app.close();
            config.useUniqueHistogramName = true;
            delete require.cache[require.resolve('./server/koa-server')];
            delete require.cache[require.resolve('../../../src/metrics-middleware.js')];
            app = require('./server/koa-server-exclude-routes');
            app = app.listen(3000);
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
