'use strict'

const tap = require('tap')
const request = require('request')

const env = require('./test-env/init')()
const server = require('../lib/server')

const headers = env.getTestAuthHeaders(env.users.sysadminUser.email)

let CompositionTestEnv = (t, test) => {
  env.initDB((err, db) => {
    t.error(err)

    server.start((err) => {
      t.error(err)

      env.createResource(t, env.testCompositions().doc1, 'Composition', (err, ref1) => {
        t.error(err)
        env.createResource(t, env.testCompositions().doc2, 'Composition', (err, ref2) => {
          t.error(err)
          env.createResource(t, env.testCompositions().doc3, 'Composition', (err, ref3) => {
            t.error(err)
            env.createResource(t, env.testCompositions().doc4, 'Composition', (err, ref4) => {
              t.error(err)
              test(db, [ref1, ref2, ref3, ref4], () => {
                env.clearDB((err) => {
                  t.error(err)
                  server.stop(() => {
                    t.end()
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

tap.test('Composition - should return all results when there are no parameters', (t) => {
  // given
  CompositionTestEnv(t, (db, refs, done) => {
    request({
      url: 'http://localhost:3447/fhir/Composition',
      headers: headers,
      json: true
    }, (err, res, body) => {
      // then
      t.error(err)

      t.equal(res.statusCode, 200, 'response status code should be 200')
      t.ok(body)
      t.equals(4, body.total, 'total should be four')
      t.equals('Bundle', body.resourceType, 'should return a Bundle')
      t.equals('Composition', body.entry[0].resource.resourceType, 'should return a resource of type Composition')
      t.equals('Composition', body.entry[1].resource.resourceType, 'should return a resource of type Composition')
      t.equals('Composition', body.entry[2].resource.resourceType, 'should return a resource of type Composition')
      t.equals('Composition', body.entry[3].resource.resourceType, 'should return a resource of type Composition')
      done()
    })
  })
})

tap.test('Composition - should fail for invalid Composition resource ID', (t) => {
  // given
  CompositionTestEnv(t, (db, refs, done) => {
    request({
      url: 'http://localhost:3447/fhir/Composition/77ssssssssssssssssssssss',
      headers: headers,
      json: true
    }, (err, res, body) => {
      // then
      t.error(err)

      t.equal(res.statusCode, 404, 'response status code should be 404')
      t.ok(body)
      t.equals('not-found', body.issue[0].code, 'should return binary "not-found"')
      t.equals('OperationOutcome', body.resourceType, 'should return a OperationOutcome')
      done()
    })
  })
})

tap.test('Composition - should fetch Composition for valid resource ID', (t) => {
  // given
  CompositionTestEnv(t, (db, refs, done) => {
    request({
      url: 'http://localhost:3447/fhir/Composition',
      headers: headers,
      json: true
    }, (err, res, body) => {
      // then
      t.error(err)

      t.equal(res.statusCode, 200, 'response status code should be 200')
      t.ok(body)

      request({
        url: `http://localhost:3447/fhir/Composition/${body.entry[0].resource.id}`,
        headers: headers,
        json: true
      }, (err, res, resource) => {
        // then
        t.error(err)
        t.ok(body)

        t.equals(body.entry[0].resource.title, resource.title, 'should have the same title property"')
        done()
      })
    })
  })
})

tap.test('composition should be found with matching status', (t) => {
  CompositionTestEnv(t, (db, refs, done) => {
    request({
      url: `http://localhost:3447/fhir/Composition?status=final`,
      headers: headers,
      json: true
    }, (err, res, body) => {
      t.error(err)

      t.equal(res.statusCode, 200, 'response status code should be 200')
      t.ok(body)
      t.equal(body.resourceType, 'Bundle', 'result should be a bundle')
      t.equal(body.total, 1, 'body should contain one result')
      t.equals(body.entry[0].resource.status, 'final')

      done()
    })
  })
})

tap.test('composition should be found with matching status', (t) => {
  CompositionTestEnv(t, (db, refs, done) => {
    request({
      url: `http://localhost:3447/fhir/Composition?status=preliminary`,
      headers: headers,
      json: true
    }, (err, res, body) => {
      t.error(err)

      t.equal(res.statusCode, 200, 'response status code should be 200')
      t.ok(body)
      t.equal(body.resourceType, 'Bundle', 'result should be a bundle')
      t.equal(body.total, 0, 'body should contain no results')

      done()
    })
  })
})
