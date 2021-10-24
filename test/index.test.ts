import { describe, it } from 'mocha'
import express, { Express } from 'express'
import request from 'supertest'
import { foaf, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import asyncMiddleware from 'middleware-async'
import { expect } from 'chai'
import { attach, resource } from '..'

describe('middleware', () => {
  let app: Express

  beforeEach(() => {
    app = express()
  })

  describe('resource', () => {
    it('returns exact node as pointer', async () => {
      // given
      app.use(resource())
      app.use(asyncMiddleware(async (req, res) => {
        const resource = await req.resource()

        res.send(resource.out(rdf.type).values)
      }))

      // when
      const response = await request(app)
        .post('/foo/bar/baz')
        .send(turtle`<http://example.com/foo/bar/baz> a ${schema.Person}, ${foaf.Agent} .`.toString())
        .set('host', 'example.com')
        .set('content-type', 'text/turtle')

      // then
      expect(response.body).to.contain.all.members([
        foaf.Agent.value,
        schema.Person.value,
      ])
    })

    it('returns relative blank node as pointer', async () => {
      // given
      app.use(resource())
      app.use(asyncMiddleware(async (req, res) => {
        const resource = await req.resource()

        res.send(resource.out(rdf.type).values)
      }))

      // when
      const response = await request(app)
        .post('/foo/bar/baz')
        .send(turtle`<> a ${schema.Person}, ${foaf.Agent} .`.toString())
        .set('host', 'example.com')
        .set('content-type', 'text/turtle')

      // then
      expect(response.body).to.contain.all.members([
        foaf.Agent.value,
        schema.Person.value,
      ])
    })

    it('parses relative URLs', async () => {
      // given
      app.use(resource())
      app.use(asyncMiddleware(async (req, res) => {
        const resource = await req.resource()

        res.send(resource.out(rdf.type).values)
      }))

      // when
      const response = await request(app)
        .post('/foo/bar/baz')
        .send(turtle`<> a ${schema.Person}, ${foaf.Agent} .`.toString())
        .set('host', 'example.com')
        .set('content-type', 'text/turtle')

      // then
      expect(response.body).to.contain.all.members([
        foaf.Agent.value,
        schema.Person.value,
      ])
    })

    it('can be attached on demand', async () => {
      app.use(asyncMiddleware(async (req, res) => {
        await attach(req, res)

        res.send({
          reqResource: !!req.resource,
          resResource: !!res.resource,
        })
      }))

      // when
      const response = request(app).get('/foo/bar/baz')

      // then
      await response.expect({
        reqResource: true,
        resResource: true,
      })
    })

    it('returns same object when called multiple times', async () => {
      // given
      app.use(resource())
      app.use(asyncMiddleware(async (req, res) => {
        const first = await req.resource()
        const second = await req.resource()

        res.send(Object.is(first, second))
      }))

      // when
      const response = await request(app)
        .post('/foo/bar/baz')
        .send(turtle`<http://example.com/foo/bar/baz> a ${schema.Person}, ${foaf.Agent} .`.toString())
        .set('host', 'example.com')
        .set('content-type', 'text/turtle')

      // then
      expect(response.body).to.eq(true)
    })
  })
})
