# express-rdf-request

Middleware which attaches a `req.resource()` to simplify getting a Graph Pointer to the request payload and `res.resource()` for the easiest possible way to send a Graph Pointer in response.

## Usage

```js
import { resource } from 'express-rdf-request'
import express from 'express'

const app = express()
app.use(resource())

app.use(async function echo(req, res) {
  // get resource parsed from body
  const resource = await req.resource()
  
  // send it back
  res.resource(resource)
})
```

## What it does

Uses [@rdfjs/express-handler](https://npm.im/@rdfjs/express-handler) to parse the incoming request as RDF and to serialize responses.

If not otherwise configured, it will attempt parsing the request by setting the requested URL as base IRI. Then, any relative Named Nodes will be made absolute relative to the request URL.

Finally, the node exactly matching the requested URI will be returned as Graph Pointer.

## Configuration

All configuration is optional.

```typescript
app.use(resource({
  factory, // RDF/JS factory - by default uses rdf-ext
  getTerm(req: express.Request): NamedNode {
      // change the request term
      // by default uses the package absolute-url
      return req.hydra.term
  }
}))
```
