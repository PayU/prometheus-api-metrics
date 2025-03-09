'use strict';
var Router = require('koa-router');
var router = new Router();
const sleep = require('../../../utils/sleep');

router.get('/', bad);
router.get('/bad', bad);
router.get('/bad/:time', bad);
router.get('/bad/:var1/:var2', bad);
router.post('/test', test);
router.patch('/:time', bad);
router.get('/hello', bad);
router.get('/hello/:time', helloTime);

async function test(ctx, next) {
    await sleep(Number.parseInt(ctx.request.body.delay || 1));

    ctx.status = 201;
    ctx.body = { message: 'Hello World!' };
    next();
};

async function helloTime (ctx, next) {
    await sleep(Number.parseInt(ctx.params.time));
    ctx.status = 200;
    ctx.boy = { message: 'Hello World!' };
    next();
};

function bad (ctx, next) {
    ctx.throw(500, new Error('My Error'));
};

router.use(async (ctx, next) => {
    if (ctx.headers.error) {
        ctx.throw(500, new Error('My Error'));
    }
    next();
});

module.exports = router;
