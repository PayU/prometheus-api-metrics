'use strict';

const express = require('express');
const middleware = require('../../../../src/index.js').expressMiddleware;

const app = express();
app.use(middleware({ includeQueryParams: true }));

app.all('*', (req, res, next) => {
    res.status(200);
    res.json({ message: 'Hello World!' });
});

// Error handler
app.use((err, req, res, next) => {
    res.statusCode = 500;
    // Do not expose your error in production
    res.json({ error: err.message });
});

module.exports = app;
