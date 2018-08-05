import * as express from 'express';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { UsersModule } from "./users.module";
import { UsersController} from "./users.controller";

const middleware = require('../../../src/metrics-middleware.js');
const expect = require('chai').expect;

describe('when using nest-js framework', () => {
    const server = express();
    const userService = {};

    before(() => {
        let module = Test.createTestingModule({imports: [UsersModule]});

        module = module.overrideProvider(UsersController).useValue(userService);

        return module.compile()
            .then((compiledModule) => {
                let app = compiledModule.createNestApplication(server);

                app.use(middleware());

                return app.init();
            });
    });

    describe('when calling a POST user/:user_id endpoint with user_id as pattern', function () {
        before(() => {
            return request(server)
                .post('/users/123')
                .expect(201)
                .expect({
                    result: 'success'
                });
        });
        it('should add it to the histogram', function () {
            return request(server)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('method="POST",route="/users/:user_id",code="201"');
                });
        });
    });

    describe('When calling a GET user/:user_id/app-id/:app_id with user_id and app_id as pattern', function() {
        before(() => {
            return request(server)
                .get('/users/123/app-id/456')
                .expect(200)
                .expect({
                    app_id: 'some_app_id'
                });
        });

        it('should add it to the histogram', function () {
            return request(server)
                .get('/metrics')
                .expect(200)
                .then((res) => {
                    expect(res.text).to.contain('method="GET",route="/users/:user_id/app-id/:app_id",code="200"');
                });
        });
    });
});