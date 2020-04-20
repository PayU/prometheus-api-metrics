# Prometheus API Monitoring

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Apache 2.0 License][license-image]][license-url]

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<!-- **Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)* -->

- [Goal](#goal)
- [Features](#features)
- [Usage](#usage)
  - [Options](#options)
  - [Access the metrics](#access-the-metrics)
- [Custom Metrics](#custom-metrics)
  - [Note](#note)
- [Request.js HTTP request duration collector](#requestjs-http-request-duration-collector)
  - [Usage](#usage-1)
    - [request](#request)
    - [request-promise-native](#request-promise-native)
- [Test](#test)
- [Usage in koa](#usage-in-koa)
- [Prometheus Examples Queries](#prometheus-examples-queries)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Goal

API and process monitoring with [Prometheus](https://prometheus.io) for Node.js micro-service

**Note: Prometheus (`prom-client`) is a peer dependency since 1.x version**

## Features

- [Collect API metrics for each call](#usage)
   - Response time in seconds
   - Request size in bytes
   - Response size in bytes
   - Add prefix to metrics names - custom or project name
   - Exclude specific routes from being collect
   - Number of open connections to the server
- Process Metrics as recommended by Prometheus [itself](https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors)
- Endpoint to retrieve the metrics - used for Prometheus scraping
   - Prometheus format
   - JSON format (`${path}.json`)
- Support custom metrics
- [Http function to collect request.js HTTP request duration](#requestjs-http-request-duration-collector)

## Usage

```js
const apiMetrics = require('prometheus-api-metrics');
app.use(apiMetrics())
```

### Options

- metricsPath - Path to access the metrics. `default: /metrics`
- defaultMetricsInterval - the interval to collect the process metrics in milliseconds. `default: 10000`
- durationBuckets - Buckets for response time in seconds. `default: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]`
- requestSizeBuckets - Buckets for request size in bytes. `default: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]`
- responseSizeBuckets - Buckets for response size in bytes. `default: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]`
- useUniqueHistogramName - Add to metrics names the project name as a prefix (from package.json)
- metricsPrefix - A custom metrics names prefix, the package will add underscore between your prefix to the metric name.
- excludeRoutes - Array of routes to exclude. Routes should be in your framework syntax.
- includeQueryParams - A boolean that indicate if to include query params in route, the query parameters will be sorted in order to eliminate the number of unique labels.

### Access the metrics

To get the metrics in Prometheus format use:
```sh
curl http[s]://<host>:[port]/metrics
```

To get the metrics in JSON format use:
```sh
curl http[s]://<host>:[port]/metrics.json
```

**Note:**

1. If you pass to the middleware the `metricsPath` option the path will be the one that you chose.

2. If you are using express framework and no route was found for the request (e.g: 404 status code), the request will not be collected. that's because we'll risk memory leak since the route is not a pattern but a hardcoded string.


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

## Request.js HTTP request duration collector
This feature enables you to easily process the result of Request.js timings feature.

### Usage
####Initialize
You can choose to initialized this functionality as a Class or not

**Class:**
```js
const HttpMetricsCollector = require('prometheus-api-metrics').HttpMetricsCollector;
const collector = new HttpMetricsCollector();
collector.init();
```

**Singelton:**
```js
const HttpMetricsCollector = require('prometheus-api-metrics').HttpMetricsCollector;
HttpMetricsCollector.init();
```

#### Options
- durationBuckets - the histogram buckets for request duration.
- countClientErrors - Boolean that indicates whether to collect client errors as Counter, this counter will have target and error code labels.
- useUniqueHistogramName - Add to metrics names the project name as a prefix (from package.json)
- prefix - A custom metrics names prefix, the package will add underscore between your prefix to the metric name.


For Example:

#### request
```js
request({ url: 'http://www.google.com', time: true }, (err, response) => {
    Collector.collect(err || response);
});
```

#### request-promise-native
```js
return requestPromise({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', route: 'v2/:id', time: true, resolveWithFullResponse: true }).then((response) => {
    Collector.collect(response);
}).catch((error) => {
    Collector.collect(error);
});
```

**Notes:** 
1. In order to use this feature you must use `{ time: true }` as part of your request configuration and then pass to the collector the response or error you got.
2. In order to use the timing feature in request-promise/request-promise-native you must also use `resolveWithFullResponse: true`
3. Override - you can override the `route` and `target` attribute instead of taking them from the request object. In order to do that you should set a `metrics` object on your request with those attribute:
``` js
request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com', route: 'v2/:id' }, time: true }, (err, response) => {...};
});
```

## Usage in koa
This package supports koa server that uses [`koa-router`](https://www.npmjs.com/package/koa-router) and [`koa-bodyparser`](https://www.npmjs.com/package/koa-bodyparser)


## Test

```
npm test
```

## Prometheus Examples Queries

### [Apdex](https://en.wikipedia.org/wiki/Apdex)

```
(sum(rate(http_request_duration_seconds_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>">, route="<ROUTE_NAME>", le="0.05"}[10m])) by (<SERVICE_LABLE_FIELD>) + sum(rate(http_request_duration_seconds_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>", route="<ROUTE_NAME>", le="0.1"}[10m])) by (<SERVICE_LABLE_FIELD>)) / 2 / sum(rate(http_request_duration_seconds_count{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>", route="<ROUTE_NAME>"}[10m])) by (<SERVICE_LABLE_FIELD>)
```

### 95th Response Time by specific route and status code
```
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>", route="<ROUTE_NAME>", code="200"}[10m])) by (le))
```

### Median Response Time Overall
```
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>"}[10m])) by (le))
```

### Median Request Size Overall
```
histogram_quantile(0.50, sum(rate(http_request_size_bytes_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>"}[10m])) by (le))
```

### Median Response Size Overall
```
histogram_quantile(0.50, sum(rate(http_response_size_bytes_bucket{<SERVICE_LABLE_FIELD>="<SERVICE_LABEL>"}[10m])) by (le))
```

### Avarage Memory Usage - All services
```
avg(nodejs_external_memory_bytes / 1024 / 1024) by (<SERVICE_LABLE_FIELD)
```

### Avarage Eventloop Latency - All services
```
avg(nodejs_eventloop_lag_seconds) by (<SERVICE_LABLE_FIELD)
```

[npm-image]: https://img.shields.io/npm/v/prometheus-api-metrics.svg?style=flat
[npm-url]: https://npmjs.org/package/prometheus-api-metrics
[travis-image]: https://travis-ci.org/PayU/prometheus-api-metrics.svg?branch=master
[travis-url]: https://travis-ci.org/PayU/prometheus-api-metrics
[coveralls-image]: https://coveralls.io/repos/github/PayU/prometheus-api-metrics/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/PayU/prometheus-api-metrics?branch=master
[downloads-image]: http://img.shields.io/npm/dm/prometheus-api-metrics.svg?style=flat
[downloads-url]: https://npmjs.org/package/prometheus-api-metrics
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: LICENSE
[snyk-image]: https://snyk.io/test/npm/prometheus-api-metrics/badge.svg
[snyk-url]: https://snyk.io/test/npm/prometheus-api-metrics
