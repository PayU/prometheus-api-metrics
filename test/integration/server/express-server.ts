import express from 'express'
import Prometheus, { Counter } from 'prom-client'
import bodyParser from 'body-parser'

const { ExpressMiddlewareFactory } = require('../../../src')

const router = require('./router')

const checkoutsTotal = Prometheus.register.getSingleMetric('checkouts_total') || new Prometheus.Counter({
  name: 'checkouts_total',
  help: 'Total number of checkouts',
  labelNames: [ 'payment_method' ]
})

const factory = (config) => {
  const app = express()
  app.use(ExpressMiddlewareFactory('express-test', '1.0.0')({ ...config }))
  app.use(bodyParser.json())
  app.use((req, res, next) => {
    if (req.headers.error) {
      next(new Error('Error'))
    }
    next()
  })
  app.use('/v2', router)

  app.get('/hello', (req, res, next) => {
    setTimeout(() => {
      res.json({ message: 'Hello World!' })
      next()
    }, Math.round(Math.random() * 200))
  })

  app.get('/hello/:time', (req, res, next) => {
    setTimeout(() => {
      res.json({ message: 'Hello World!' })
      next()
    }, parseInt(req.params.time))
  })

  app.get('/bad', (req, res, next) => {
    next(new Error('My Error'))
  })

  app.get('/checkout', (req, res, next) => {
    const paymentMethod = Math.round(Math.random()) === 0 ? 'stripe' : 'paypal'

    if (checkoutsTotal instanceof Counter) {
      checkoutsTotal.inc({
        payment_method: paymentMethod
      })
    }

    res.json({ status: 'ok' })
    next()
  })

  app.post('/test', (req, res, next) => {
    setTimeout(() => {
      res.status(201)
      res.json({ message: 'Hello World!' })
      next()
    }, req.body.delay)
  })

  app.get('/_next/*', (req, res) => {
    res.status(200)
    res.json({ message: 'Hello World!' })
  })

  app.get('/parameter/:params', (req, res) => {
    res.status(200)
    res.json({ param: req.params.param })
  })

// Error handler
  app.use((err, req, res, next) => {
    res.statusCode = 500
    // Do not expose your error in production
    console.error(err)
    res.json({ error: err.message })
  })

  return app
}
module.exports = factory
