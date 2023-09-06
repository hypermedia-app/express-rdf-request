import { DataFactory, DatasetCoreFactory, NamedNode } from 'rdf-js'
import express from 'express'
import type { AnyPointer, GraphPointer } from 'clownface'
import rdfHandler from '@rdfjs/express-handler'
import asyncMiddleware from 'middleware-async'
import absoluteUrl from 'absolute-url'
import isRelativeUrl from 'is-relative-url'
import once from 'once'
import type { Environment } from '@rdfjs/environment/Environment'
import type ClownfaceFactory from 'clownface/Factory'

declare module 'express-serve-static-core' {
  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }

  interface Response {
    resource(resource: AnyPointer): Promise<void>
  }
}

declare module 'rdf-js' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Stream extends AsyncIterable<import('rdf-js').Quad> {}
}

type Env = Environment<DataFactory | DatasetCoreFactory | ClownfaceFactory>

interface GetTerm {
  ($rdf: Env, req: express.Request): NamedNode
}

function defaultTerm($rdf: Env, req: express.Request) {
  absoluteUrl.attach(req)

  return $rdf.namedNode(req.absoluteUrl())
}

interface Options {
  getTerm?: GetTerm
  factory: Env
}

export async function attach(req: express.Request, res: express.Response, { getTerm = defaultTerm, factory }: Options): Promise<void> {
  await rdfHandler.attach(req, res, {
    baseIriFromRequest: true,
    factory,
  })

  if (!req.resource) {
    req.resource = once(async () => {
      const term = getTerm(factory, req)
      if (!term) {
        throw new Error('Could not determine request term.')
      }

      const dataset = factory.dataset()

      for (const quad of await req.dataset!()) {
        const { predicate, graph } = quad
        const subject = quad.subject.termType === 'NamedNode' && isRelativeUrl(quad.subject.value) ? term : quad.subject
        const object = quad.object.termType === 'NamedNode' && isRelativeUrl(quad.object.value) ? term : quad.object

        dataset.add(factory.quad(subject, predicate, object, graph))
      }

      return factory.clownface({ dataset }).node(term)
    })

    res.resource = (pointer: AnyPointer) => res.dataset(pointer.dataset)
  }
}

export const resource = (options: Options): express.RequestHandler => asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  await attach(req, res, options)

  next()
})
