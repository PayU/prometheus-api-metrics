# Changelog

## Master

### Features

- Add support for custom labels addition to metrics

### Improvements

- Add support for `prom-client v13`, which includes a few breaking changes, mainly the following functions are now async (return a promise):
  ```
  registry.metrics()
  registry.getMetricsAsJSON()
  registry.getMetricsAsArray()
  registry.getSingleMetricAsString()
  ```
  More info at [`prom-client v13` Release Page](https://github.com/siimon/prom-client/releases/tag/v13.0.0).

## 3.1.0 - 3 September, 2020

- Added support for axios responses while using axios-time plugin

## 3.0.0 - 2 September, 2020

### Breaking changes

- Drop Node 6/8 support
