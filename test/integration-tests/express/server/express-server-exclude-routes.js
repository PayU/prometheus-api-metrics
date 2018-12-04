'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const middleware = require('../../../../src/index.js');

app.use(middleware({ excludeRoutes: ['/health', '/health/:id'], includeQueryParams: true }));
app.use(bodyParser.json());

app.get('', (req, res, next) => {
    setTimeout(() => {
        res.json({ message: 'Hello World!' });
        next();
    }, Math.round(Math.random() * 200));
});

app.get('/hello', (req, res, next) => {
    setTimeout(() => {
        res.json({ message: 'Hello World!' });
        next();
    }, Math.round(Math.random() * 200));
});

app.get('/health', (req, res, next) => {
    setTimeout(() => {
        res.status(200);
        res.json({ message: 'Hello World!' });
        next();
    }, req.body.delay);
});

app.get('/health/:id', (req, res, next) => {
    setTimeout(() => {
        res.status(200);
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