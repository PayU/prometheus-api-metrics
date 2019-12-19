import express from 'express'
const { ExpressMiddlewareFactory } = require('../../../src')

const bodyParser = require('body-parser')

const factory = (config) => {
  const app = express()
  app.use(ExpressMiddlewareFactory('express-test2', '1.0.0')({
    excludeRoutes: [ '/health', '/health/:id' ],
    includeQueryParams: true,
    ...config
  }))
  app.use(bodyParser.json())

  app.get('', (req, res, next) => {
    setTimeout(() => {
      res.json({ message: 'Hello World!' })
      next()
    }, Math.round(Math.random() * 200))
  })

  app.get('/hello', (req, res, next) => {
    setTimeout(() => {
      res.json({ message: 'Hello World!' })
      next()
    }, Math.round(Math.random() * 200))
  })

  app.get('/health', (req, res, next) => {
    setTimeout(() => {
      res.status(200)
      res.json({ message: 'Hello World!' })
      next()
    }, req.body.delay)
  })

  app.get('/health/:id', (req, res, next) => {
    setTimeout(() => {
      res.status(200)
      res.json({ message: 'Hello World!' })
      next()
    }, req.body.delay)
  })

// Error handler
  app.use((err, req, res, next) => {
    res.statusCode = 500
    // Do not expose your error in production
    res.json({ error: err.message })
  })

  return app
}
module.exports = factory
