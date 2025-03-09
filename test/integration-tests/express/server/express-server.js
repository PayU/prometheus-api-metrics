'use strict';

const express = require('express');
const Prometheus = require('prom-client');
const bodyParser = require('body-parser');
const config = require('./config');
const app = express();
const middleware = require('../../../../src/index.js').expressMiddleware;
const router = require('./router');

const checkoutsTotal = Prometheus.register.getSingleMetric('checkouts_total') || new Prometheus.Counter({
    name: 'checkouts_total',
    help: 'Total number of checkouts',
    labelNames: ['payment_method']
});

app.use(middleware({ useUniqueHistogramName: config.useUniqueHistogramName }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    if (req.headers.error) {
        next(new Error('Error'));
    }
    next();
});
app.use('/v2', router);

app.get('/hello', (req, res, next) => {
    setTimeout(() => {
        res.json({ message: 'Hello World!' });
        next();
    }, Math.round(Math.random() * 200));
});

app.get('/hello/:time', (req, res, next) => {
    setTimeout(() => {
        res.json({ message: 'Hello World!' });
        next();
    }, parseInt(req.params.time));
});

app.get('/bad', (req, res, next) => {
    next(new Error('My Error'));
});

app.get('/checkout', (req, res, next) => {
    const paymentMethod = Math.round(Math.random()) === 0 ? 'stripe' : 'paypal';

    checkoutsTotal.inc({
        payment_method: paymentMethod
    });

    res.json({ status: 'ok' });
    next();
});

app.post('/test', (req, res, next) => {
    setTimeout(() => {
        res.status(201);
        res.json({ message: 'Hello World!' });
        next();
    }, req.body.delay);
});

// Error handler
app.use((err, req, res, next) => {
    res.statusCode = 500;
    // Do not expose your error in production
    res.json({ error: err.message });
});

module.exports = app;
