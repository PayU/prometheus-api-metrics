import Express from '../../../src/middlewares/express'
import * as assert from 'assert'


describe('parseRoute', () => {
  let e
  before(() => {
    e = new Express({ groupParametrizedQuery: true })
  })
  it('should properly return N/A when no req', () => {
    const fakeReq = {}
    const route = e.getRoute(fakeReq)
    assert.equal(route, 'N/A')
  })

  it('should properly return N/A when no baseUrl', () => {
    const fakeReq = {
      baseUrl: ''
    }
    const route = e.getRoute(fakeReq)
    assert.equal(route, 'N/A')
  })

  it('should properly return N/A when root route path', () => {
    const fakeReq = {
      route: {
        path: '/'
      }
    }
    const route = e.getRoute(fakeReq)
    assert.equal(route, 'N/A')
  })

  it('should properly return route when wildcard present', () => {
    const fakeReq = {
      route: { path: '/_next/*' },
      originalUrl: '/_next/static/test.js'
    }
    const route = e.getRoute(fakeReq)
    assert.equal(route, '/_next/*')
  })

  it('should properly return route when parametrized url', () => {
    const fakeReq = {
      route: { path: '/parameter/:params' },
      originalUrl: '/parameter/joe'
    }
    const route = e.getRoute(fakeReq)
    assert.equal(route, '/parameter/joe')
  })
})
