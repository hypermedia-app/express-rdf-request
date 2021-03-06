import { DataFactory, DatasetCoreFactory, NamedNode } from 'rdf-js'
import express from 'express'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import * as rdfHandler from '@rdfjs/express-handler'
import asyncMiddleware from 'middleware-async'
import * as absoluteUrl from 'absolute-url'
import isRelativeUrl from 'is-relative-url'
import once from 'once'

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

interface GetTerm {
  (req: express.Request): NamedNode
}

function defaultTerm(req: express.Request) {
  absoluteUrl.attach(req)

  return $rdf.namedNode(req.absoluteUrl())
}

interface Options {
  getTerm?: GetTerm
  factory?: DataFactory & DatasetCoreFactory
}

export async function attach(req: express.Request, res: express.Response, { getTerm = defaultTerm, factory = $rdf }: Options = {}): Promise<void> {
  await (rdfHandler as any).attach(req, res, {
    baseIriFromRequest: true,
    factory,
  })

  if (!req.resource) {
    req.resource = once(async () => {
      const term = getTerm(req)
      if (!term) {
        throw new Error('Could not determine request term.')
      }

      const dataset = factory.dataset()

      for (const quad of await req.dataset()) {
        const { predicate, graph } = quad
        const subject = quad.subject.termType === 'NamedNode' && isRelativeUrl(quad.subject.value) ? term : quad.subject
        const object = quad.object.termType === 'NamedNode' && isRelativeUrl(quad.object.value) ? term : quad.object

        dataset.add(factory.quad(subject, predicate, object, graph))
      }

      return clownface({ dataset }).node(term)
    })

    res.resource = (pointer: AnyPointer) => res.dataset(pointer.dataset)
  }
}

export const resource = (options?: Options): express.RequestHandler => asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  await attach(req, res, options)

  next()
})
