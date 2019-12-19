import express from 'express'
var router = express.Router()
const subRouter = require('./sub-router')
router.use((req, res, next) => {
  if (req.headers.error) {
    next(new Error('Error'))
  }
  next()
})

router.use('/v3', subRouter, errorHandler)
router.use('/v4', subRouter)
router.route('/').get(bad)
router.route('/bad').get(bad)
router.route('/bad/:time').get(bad)
router.route('/bad/:var1/:var2').get(bad)
router.route('/test').post(eTest)
router.route('/:time').patch(bad)
router.route('/hello/:time').get(helloTime)
router.route('/error/:var1').get(bad, errorHandler)

function eTest(req, res, next) {
  setTimeout(() => {
    res.status(201)
    res.json({ message: 'Hello World!' })
    next()
  }, req.body.delay)
}

function helloTime(req, res, next) {
  setTimeout(() => {
    res.json({ message: 'Hello World!' })
    next()
  }, parseInt(req.param.time))
}

function bad(req, res, next) {
  next(new Error('My Error'))
}

// Error handler
function errorHandler(err, req, res, next) {
  res.statusCode = 500
  // Do not expose your error in production
  res.json({ error: err.message })
}

module.exports = router
