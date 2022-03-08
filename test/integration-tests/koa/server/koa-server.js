'use strict';

const Koa = require('koa');
const Prometheus = require('prom-client');
const bodyParser = require('koa-bodyparser');
const config = require('./config');
const app = new Koa();
const middleware = require('../../../../src/index.js').koaMiddleware;
const subRouter = require('./router');
const sleep = require('../../../utils/sleep');
const Router = require('koa-router');
const router = new Router();

const checkoutsTotal = Prometheus.register.getSingleMetric('checkouts_total') || new Prometheus.Counter({
    name: 'checkouts_total',
    help: 'Total number of checkouts',
    labelNames: ['payment_method']
});

app.use(bodyParser());

// Error handler
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = 500;
        // Do not expose your error in production
        ctx.body = { error: err.message };
    }
});

app.use(middleware({ useUniqueHistogramName: config.useUniqueHistogramName }));

app.use((ctx, next) => {
    if (ctx.headers.error) {
        throw new Error('Error');
    }
    return next();
});

app.use(subRouter.routes());
app.use(router.routes());

router.get('/hello', async (ctx, next) => {
    await sleep(Math.round(Math.random() * 200));
    ctx.status = 200;
    ctx.body = { message: 'Hello World!' };
    return next();
});

router.get('/hello/:time', async (ctx, next) => {
    await sleep(ctx.params.time);
    ctx.status = 200;
    ctx.body = { message: 'Hello World!' };
    return next();
});

router.get('/bad', (ctx, next) => {
    ctx.throw(new Error('My Error'));
});

router.get('/checkout', (ctx, next) => {
    const paymentMethod = Math.round(Math.random()) === 0 ? 'stripe' : 'paypal';

    checkoutsTotal.inc({
        payment_method: paymentMethod
    });

    ctx.body = { status: 'ok' };
    next();
});

router.post('/test', async (ctx, next) => {
    await sleep(ctx.request.body.delay || 1);
    ctx.status = 201;
    ctx.body = { message: 'Test World!' };
    return next();
});

router.get('/wild-path/(.*)', (ctx, next) => {
    ctx.status = 200;
    ctx.body = { message: 'Wildcard route reached!' };
    return next();
});

module.exports = app;
