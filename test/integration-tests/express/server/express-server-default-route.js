'use strict';

const express = require('express');
const middleware = require('../../../../src/index.js').expressMiddleware;

const app = express();
app.use(middleware({ includeQueryParams: true }));

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello World!' });
})

app.all('*', (req, res) => {
    res.status(200);
    res.json({ message: 'Default' });
});

module.exports = app;
