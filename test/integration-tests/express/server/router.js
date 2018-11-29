'use strict';
var express = require('express');
var router = express.Router();

router.use((req, res, next) => {
    if (req.headers.error) {
        next(new Error('Error'));
    }
    next();
});

router.route('/').get(bad);
router.route('/bad').get(bad);
router.route('/bad/:time').get(bad);
router.route('/bad/:var1/:var2').get(bad);
router.route('/test').post(test);
router.route('/:time').patch(helloTime);
router.route('/hello/:time').get(helloTime);

function test (req, res, next) {
    setTimeout(() => {
        res.status(201);
        res.json({ message: 'Hello World!' });
        next();
    }, req.body.delay);
};

function helloTime (req, res, next) {
    setTimeout(() => {
        res.json({ message: 'Hello World!' });
        next();
    }, parseInt(req.param.time));
};

function bad (req, res, next) {
    next(new Error('My Error'));
};

module.exports = router;