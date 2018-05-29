# Prometheus API Monitoring

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Apache 2.0 License][license-image]][license-url]

API and process monitoring with [Prometheus](https://prometheus.io) for Node.js micro-service

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<!-- **Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)* -->

- [Prometheus API Monitoring](#prometheus-api-monitoring)
  - [Features](#features)
  - [Usage](#usage)
    - [Options](#options)
    - [Access the metrics](#access-the-metrics)
  - [Custom Metrics](#custom-metrics)
  - [Test](#test)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

- Collect API metrics for each call
   - Response time in milliseconds
   - Request size in bytes
   - Response size in bytes
- Process Metrics as recommended by Prometheus [itself](https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors)
- Endpoint to retrive the matrics - used for Prometheus scraping
   - Prometheus format
   - JSON format (`${path}.json`)
- Support custom metrics

## Usage

```js
const apiMetrics = require('prometheus-api-metrics');
app.use(apiMetrics())
```

### Options

- metricsPath - Path to access the metrics. `default: /metrics`
- defaultMetricsInterval - the inverval to collect the process metrics in milliseconds. `default: 10000`
- durationBuckets - Buckets for response time in milliseconds. `default: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]`
- requestSizeBuckets - Buckets for request size in bytes. `default: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]`
- responseSizeBuckets - Buckets for response size in bytes. `default: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]`

### Access the metrics

To get the metrics in Prometheus format use:
```sh
curl http[s]://<host>:[port]/metrics
```

To get the metrics in JSON format use:
```sh
curl http[s]://<host>:[port]/metrics.json
```

#### Note
If you pass to the middleware the `metricsPath` option the path will be the one the you choosed.

## Custom Metrics

You can expand the API metrics with more metrics that you would like to expose.
All you have to do is: 

Require prometheus client
```js
const Prometheus = require('prom-client');
```

Create new metric from the kind that you like
```js
const checkoutsTotal = new Prometheus.Counter({
  name: 'checkouts_total',
  help: 'Total number of checkouts',
  labelNames: ['payment_method']
});
```

Update it:
```js
checkoutsTotal.inc({
  payment_method: paymentMethod
})
```

The custom metrics will be exposed under the same endpoint as the API metrics.

For more info about the Node.js Prometheus client you can read [here](https://github.com/siimon/prom-client#prometheus-client-for-nodejs--)

### Note
This will work only if you use the default Prometheus registry - do not use `new Prometheus.Registry()`

## Test

```
npm test
```
[npm-image]: https://img.shields.io/npm/v/prometheus-api-metrics.svg?style=flat
[npm-url]: https://npmjs.org/package/prometheus-api-metrics
[travis-image]: https://travis-ci.org/Zooz/prometheus-api-metrics.svg?branch=master
[travis-url]: https://travis-ci.org/Zooz/prometheus-api-metrics
[coveralls-image]: https://coveralls.io/repos/github/Zooz/prometheus-api-metrics/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/Zooz/prometheus-api-metrics?branch=master
[downloads-image]: http://img.shields.io/npm/dm/prometheus-api-metrics.svg?style=flat
[downloads-url]: https://npmjs.org/package/prometheus-api-metrics
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: LICENSE