export function getMetricNames(metricNames, useUniqueHistogramName, metricsPrefix, projectName) {
  const prefix = useUniqueHistogramName === true ? projectName : metricsPrefix

  if (prefix) {
    Object.keys(metricNames).forEach(key => {
      metricNames[key] = `${prefix}_${metricNames[key]}`
    })
  }
  return metricNames
}

export function shouldLogMetrics(excludeRoutes, route) {
  return excludeRoutes.every((path) => {
    return !route.includes(path)
  })
}

export function debug(a, b?) {
  console.log(a, b)
}

export function normalizeProjectName(name) {
  return name.replace(/-/g, '_')
}
