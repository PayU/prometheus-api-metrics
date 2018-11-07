import * as express from 'express';
import * as Prometheus from 'prom-client';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { UsersModule } from "./users.module";

const expect = require('chai').expect;
let server;
describe('when using nest-js framework', () => {
    before(() => {
        const middleware = require('../../../src/index.js');
        server = express();

        let module = Test.createTestingModule({imports: [UsersModule]});

        return module.compile()
            .then((compiledModule) => {
                let app = compiledModule.createNestApplication(server);

                app.use(middleware());

                return app.init();
            });
    });
    after(() => {
        Prometheus.register.clear();
    });
    describe('when calling a POST user/:user_id endpoint with user_id as pattern', () => {
        before(() => {
            return request(server)
                .post('/users/123')
                .expect(201)
                .expect({
                    result: 'success'
                });
        });
        it('should add it to the histogram', () => {
            return request(server)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('method="POST",route="/users/:user_id",code="201"');
                });
        });
    });
    describe('When calling a GET user/:user_id/app-id/:app_id with user_id and app_id as pattern', () => {
        before(() => {
            return request(server)
                .get('/users/123/app-id/456')
                .expect(200)
                .expect({
                    app_id: 'some_app_id'
                });
        });

        it('should add it to the histogram', () => {
            return request(server)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('method="GET",route="/users/:user_id/app-id/:app_id",code="200"');
                });
        });
    });
});