# bunyan-middleware

[![Dependency Status](https://david-dm.org/tellnes/bunyan-middleware.png)](https://david-dm.org/tellnes/bunyan-middleware)
[![devDependency Status](https://david-dm.org/tellnes/bunyan-middleware/dev-status.png)](https://david-dm.org/tellnes/bunyan-middleware#info=devDependencies)

Request, response logger middleware for [bunyan](https://github.com/trentm/node-bunyan):
- log request as `req`
- log response as `res`
- log response close events as warnings
- log request<>response duration in milliseconds as `duration`
- creates, use and forward to response the `x-request-id` request header: get it if present, create it otherwise ([uuid.v1()](https://www.npmjs.com/package/uuid#uuidv1options--buffer--offset))
- log request id as `req_id` and exposes it as `req.reqId`
- provides `req.log` and `res.log` as an id-specialized logger for you to track your request in your entire application, every time you access the `request` or `response` object
- compatible with pure [http server](http://nodejs.org/api/http.html#http_http_createserver_requestlistener), [express](https://github.com/strongloop/express), [connect](https://github.com/senchalabs/connect) and any http middleware system
- uses serializers for `req` and `res` based on [bunyan serializers](https://github.com/trentm/node-bunyan#serializers) if you do not already have a serializer defined.
- obscure headers containing sensitive information in log outputs (configurable with `obscureHeaders`)
- TypeScript support

## Install

```shell
yarn add bunyan-middleware
```

or

```shell
npm install bunyan-middleware --save
```

## Usage

```js
const bunyan = require('bunyan')
const bunyanMiddleware = require('bunyan-middleware')
const express = require('express')

const app = express()
const logger = bunyan.createLogger({ name: 'My App' })

app.use(bunyanMiddleware(
    { headerName: 'X-Request-Id'
    , propertyName: 'reqId'
    , logName: 'req_id'
    , obscureHeaders: []
    , logger: logger
    , additionalRequestFinishData: function(req, res) {
        return { example: true }
      }
    }
  )

app.get('/', function (req, res) {
  // now use `req.log` as your request-specialized bunyan logger
  req.log.info('YO DAWG!')
  res.send('ok')
})
```

### Import using TypeScript

```ts
import bunyanMiddleware = require('bunyan-middleware')
```

## `X-Request-Id`

Will use and forward `X-Request-Id` (case insensitive) header when present.

Otherwise it will generate a
[uuid.v1()](https://www.npmjs.com/package/uuid#uuidv1options--buffer--offset)
and add it to the response headers.

The request id is also available as `req.reqId`.

## Express and mounted apps

If you are using this with express and mounted app which rewrites `req.url` and
you are using `bunyan.serializers.req`, then the url in the log output will be
the rewritten url. To fix that bunyan-middleware is using its own request
serializer instead of the default one which is using `req.originalUrl` instead.


## Options

**`logger`** REQUIRED

- The bunyan logger instance.

**`headerName`** Default: `'X-Request-Id'`

- The name of the HTTP header for the request id.

**`propertyName`** Default: `'reqId'`

- The name for the property on the request object to set the request id.

**`additionalRequestFinishData`** Default: `undefined`

- A function receiving `req` and `res` as arguments returning an object. The elements in the returned object will be added to the fields in the `request finish` message.

**`filter`** Default: `undefined`

- A function receiving `req` and `res` as arguments returning a boolean.
  If this functions return value is truthy it will skip all logging for
  this request/response.

**`logName`** Default: `'req_id'`

- The name for the request id in the log output.

**`level`** Default: `'info'`

- At which log level `request start` and `request finish` should be logged.

**`obscureHeaders`** Default: `null`

- Set to an array with header names to hide header values from log output.
  The output will still show header names, with value set to `null`.

- Eg: `[ 'Authorization' ]`

**`excludeHeaders`** Default: `null`

- Set to an array with header names to remove them from log output.

- Eg: `[ 'Authorization' ]`

**`requestStart`** Default: `false`

- Log the start of the request.

**`verbose`** Default: `false`

- Log `req` and `res` for `request start` and `request finish`.

## License

MIT. See the `LICENCE` file.

## See Also

- [bunyan-request](https://github.com/vvo/bunyan-request) - a fork by [vvo](https://github.com/vvo).

- [express-bunyan-logger](https://github.com/villadora/express-bunyan-logger)
