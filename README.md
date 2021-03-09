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
- [Additional Metric Labels](#additional-metric-labels)
- [Request.js HTTP request duration collector](#requestjs-http-request-duration-collector)
  - [Usage](#usage-1)
    - [Initialize](#initialize)
    - [Options](#options-1)
    - [request](#request)
    - [request-promise-native](#request-promise-native)
    - [axios](#axios)
- [Usage in koa](#usage-in-koa)
- [Test](#test)
- [Prometheus Examples Queries](#prometheus-examples-queries)
  - [Apdex](#apdex)
  - [95th Response Time by specific route and status code](#95th-response-time-by-specific-route-and-status-code)
  - [Median Response Time Overall](#median-response-time-overall)
  - [Median Request Size Overall](#median-request-size-overall)
  - [Median Response Size Overall](#median-response-size-overall)
  - [Avarage Memory Usage - All services](#avarage-memory-usage---all-services)
  - [Avarage Eventloop Latency - All services](#avarage-eventloop-latency---all-services)
- [Changelog](#changelog)

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
app.use(apiMetrics());
```

### Options

| Option                             | Type                         | Description                                                                                                                                                                                        | Default Value                                             |
| ---------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `metricsPath`                      | `String`                     | Path to access the metrics                                                                                                                                                                         | `/metrics`                                                |
| `defaultMetricsInterval`           | `Number`                     | Interval to collect the process metrics in milliseconds                                                                                                                                            | `10000`                                                   |
| `durationBuckets`                  | `Array<Number>`              | Buckets for response time in seconds                                                                                                                                                               | `[0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]`    |
| `requestSizeBuckets`               | `Array<Number>`              | Buckets for request size in bytes                                                                                                                                                                  | `[5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]` |
| `responseSizeBuckets`              | `Array<Number>`              | Buckets for response size in bytes                                                                                                                                                                 | `[5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]` |
| `useUniqueHistogramName`           | `Boolean`                    | Add to metrics names the project name as a prefix (from package.json)                                                                                                                              | `false`                                                   |
| `metricsPrefix`                    | `String`                     | A custom metrics names prefix, the package will add underscore between your prefix to the metric name                                                                                              |                                                           |
| `httpMetricsPrefix`                | `String`                     | A custom prefix for HTTP metrics only, the package will add underscore between your prefix to the metric name                                                                                      |                                                           |
| `excludeRoutes`                    | `Array<String>`              | Array of routes to exclude. Routes should be in your framework syntax                                                                                                                              |                                                           |
| `includeQueryParams`               | `Boolean`                    | Indicate if to include query params in route, the query parameters will be sorted in order to eliminate the number of unique labels                                                                | `false`                                                   |
| `additionalLabels`                 | `Array<String>`              | Indicating custom labels that can be included on each `http_*` metric. Use in conjunction with `extractAdditionalLabelValuesFn`.                                                                   |
| `extractAdditionalLabelValuesFn`   | `Function`                   | A function that can be use to generate the value of custom labels for each of the `http_*` metrics. When using koa, the function takes `ctx`, when using express, it takes `req, res` as arguments |                                                           |
| `excludeDefaultMetricLabels`       | `Boolean` or `Array<String>` | Excludes the metric labels added by default (`code`, `method`, `route`). If `true` is passed, it will exclude them all. An array of the labels that you need to exclude can also be passed         |                                                           |
| `useCountersForRequestSizeMetric`  | `Boolean`                    | Uses two counters for Request Size (`_sum` and `_count`) instead of Histogram                                                                                                                      | `false`                                                   |
| `useCountersForResponseSizeMetric` | `Boolean`                    | Uses two counters for Response Size (`_sum` and `_count`) instead of Histogram                                                                                                                     | `false`                                                   |

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
  labelNames: ['payment_method'],
});
```

Update it:

```js
checkoutsTotal.inc({
  payment_method: paymentMethod,
});
```

The custom metrics will be exposed under the same endpoint as the API metrics.

For more info about the Node.js Prometheus client you can read [here](https://github.com/siimon/prom-client#prometheus-client-for-nodejs--)

### Note

This will work only if you use the default Prometheus registry - do not use `new Prometheus.Registry()`

## Additional Metric Labels

You can define additional metric labels by using `additionalLabels` and `extractAdditionalLabelValuesFn` options.

For instance:

```js
const apiMetrics = require('prometheus-api-metrics');
app.use(
  apiMetrics({
    additionalLabels: ['customer', 'cluster'],
    extractAdditionalLabelValuesFn: (req, res) => {
      const { headers } = req.headers;
      return {
        customer: headers['x-custom-header-customer'],
        cluster: headers['x-custom-header-cluster'],
      };
    },
  })
);
```

## Request.js HTTP request duration collector

This feature enables you to easily process the result of Request.js timings feature.

### Usage

#### Initialize

You can choose to initialized this functionality as a Class or not

**Class:**

```js
const HttpMetricsCollector = require('prometheus-api-metrics')
  .HttpMetricsCollector;
const collector = new HttpMetricsCollector();
collector.init();
```

**Singelton:**

```js
const HttpMetricsCollector = require('prometheus-api-metrics')
  .HttpMetricsCollector;
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
return requestPromise({
  method: 'POST',
  url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd',
  route: 'v2/:id',
  time: true,
  resolveWithFullResponse: true,
})
  .then((response) => {
    Collector.collect(response);
  })
  .catch((error) => {
    Collector.collect(error);
  });
```

**Notes:**

1. In order to use this feature you must use `{ time: true }` as part of your request configuration and then pass to the collector the response or error you got.
2. In order to use the timing feature in request-promise/request-promise-native you must also use `resolveWithFullResponse: true`
3. Override - you can override the `route` and `target` attribute instead of taking them from the request object. In order to do that you should set a `metrics` object on your request with those attribute:

```js
request({ method: 'POST', url: 'http://www.mocky.io/v2/5bd9984b2f00006d0006d1fd', metrics: { target: 'www.google.com', route: 'v2/:id' }, time: true }, (err, response) => {...};
});
```

#### axios

```js
const axios = require('axios');
const axiosTime = require('axios-time');

axiosTime(axios);

try {
  const response = await axios({
    baseURL: 'http://www.google.com',
    method: 'get',
    url: '/',
  });
  Collector.collect(response);
} catch (error) {
  Collector.collect(error);
}
```

**Notes:**

- In order to collect metrics from axios client the [`axios-time`](https://www.npmjs.com/package/axios-time) package is required.

## Usage in koa

This package supports koa server that uses [`koa-router`](https://www.npmjs.com/package/koa-router) and [`koa-bodyparser`](https://www.npmjs.com/package/koa-bodyparser)

```js
const { koaMiddleware } = require('prometheus-api-metrics');

app.use(koaMiddleware());
```

## Test

```sh
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

## Changelog

Please see the changelog [here](CHANGELOG.md)

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
