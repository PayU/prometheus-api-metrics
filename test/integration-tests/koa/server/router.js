'use strict';
const cloneDeep = require('lodash.clonedeep');
const Router = require('koa-router');
const router = new Router({
    prefix: '/v2'
});
const sleep = require('../../../utils/sleep');
const subRouter = require('./sub-router');

router.use('/v3', cloneDeep(subRouter.routes())); // Current koa router has an open issue/bug (https://github.com/alexmingoia/koa-router/issues/244), only way found to mount a shared router at different paths.
router.use('/v4', cloneDeep(subRouter.routes()));
router.get('/', bad);
router.get('/bad', bad);
router.get('/bad/:time', bad);
router.get('/bad/:var1/:var2', bad);
router.post('/test', test);
router.patch('/:time', bad);
router.get('/hello/:time', helloTime);
router.get('/hello/', helloTime);
router.get('/error/:var1', bad);

function test (ctx, next) {
    sleep(ctx.request.body.delay || 1);
    ctx.status = 201;
    ctx.body = { message: 'Hello World!' };
    next();
};

function helloTime (ctx, next) {
    sleep(parseInt(ctx.params.time));
    ctx.status = 200;
    ctx.body = { message: 'Hello World!' };
    next();
};

function bad (ctx) {
    throw new Error({ error: 'My Error' });
};

module.exports = router;
