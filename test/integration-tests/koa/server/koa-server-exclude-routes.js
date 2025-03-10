'use strict';

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const middleware = require('../../../../src/index.js').koaMiddleware;
const Router = require('koa-router');
const router = new Router();
const sleep = require('../../../utils/sleep');

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = 500;
        // Do not expose your error in production
        ctx.body = { error: err.message };
    }
});

app.use(middleware({ excludeRoutes: ['/health', '/health/:id'], includeQueryParams: true }));
app.use(bodyParser());

app.use(router.routes());

router.get('', async (ctx, next) => {
    await sleep(Math.round(Math.random() * 200));
    ctx.body = { message: 'Hello World!' };
    ctx.status = 200;
    next();
});

router.get('/hello', async (ctx, next) => {
    await sleep(Math.round(Math.random() * 200));
    ctx.body = { message: 'Hello World!' };
    ctx.status = 200;
    next();
});

router.get('/health', async (ctx, next) => {
    await sleep(Number.parseInt(ctx.request.body.delay || 1));
    ctx.body = { message: 'Hello World!' };
    ctx.status = 200;
    next();
});

router.get('/health/:id', async (ctx, next) => {
    await sleep(Number.parseInt(ctx.request.body.delay || 1));
    ctx.body = { message: 'Hello World!' };
    ctx.status = 200;
    next();
});

module.exports = app;
