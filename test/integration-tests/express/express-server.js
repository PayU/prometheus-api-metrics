'use strict';

const express = require('express');
const Prometheus = require('prom-client');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const middleware = require('../../../src/index');

const checkoutsTotal = new Prometheus.Counter({
    name: 'checkouts_total',
    help: 'Total number of checkouts',
    labelNames: ['payment_method']
});

app.use(middleware());
app.use(bodyParser.json());

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
    }, parseInt(req.param.time));
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

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    // clearInterval(metricsInterval)

    server.close((err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        process.exit(0);
    });
});

module.exports = app;