# bunyan-middleware

[![Dependency Status](https://david-dm.org/tellnes/bunyan-middleware.png)](https://david-dm.org/tellnes/bunyan-middleware)
[![devDependency Status](https://david-dm.org/tellnes/bunyan-middleware/dev-status.png)](https://david-dm.org/tellnes/bunyan-middleware#info=devDependencies)

```shell
npm install bunyan-middleware --save
```

Request, response logger middleware for [bunyan](https://github.com/trentm/node-bunyan):
- log request as `req`
- log response as `res`
- log response close events as warnings
- log request<>response duration in milliseconds as `duration`
- creates, use and forward to response the `x-request-id` request header: get it if present, create it otherwise ([uuid.v4()](https://github.com/broofa/node-uuid#uuidv4options--buffer--offset))
- log request id as `req_id` and exposes it as `req.reqId`
- provides `req.log` and `res.log` as an id-specialized logger for you to track your request in your entire application, every time you access the `request` or `response` object
- compatible with pure [http server](http://nodejs.org/api/http.html#http_http_createserver_requestlistener), [express](https://github.com/strongloop/express), [connect](https://github.com/senchalabs/connect) and any http middleware system
- uses serializers for `req` and `res` based on [bunyan serializers](https://github.com/trentm/node-bunyan#serializers) if you do not already have a serializer defined.
- obscure headers containing sensitive information in log outputs (configureable with `obscureHeaders`)

## Install

```shell
npm install bunyan-middleware --save
```

## Usage

```js
var bunyan = require('bunyan')
  , bunyanMiddleware = require('bunyan-middleware')
  , express = require('express')

var app = express()
var logger = bunyan.createLogger({ name: 'My App' })

app.use(bunyanMiddleware(
    { headerName: 'X-Request-Id'
    , propertyName: 'reqId'
    , logName: 'req_id'
    , obscureHeaders: []
    , logger: logger
    }
  )

app.get('/', function (req, res) {
  // now use `req.log` as your request-specialized bunyan logger
  req.log.info('YO DAWG!')
  res.send('ok')
})
```

## `X-Request-Id`

Will use and forward `X-Request-Id` (case insensitive) header when present.

Otherwise it will generate
a [uuid.v4()](https://github.com/defunctzombie/node-uuid#uuidv4options--buffer--offset) and
add it to the response headers.

The request id is also available as `req.reqId`.

## Options

**`logger`** REQUIRED

- The bunyan logger instance.

**`headerName`** Default: `'X-Request-Id'`

- The name of the HTTP header for the request id.

**`propertyName`** Default: `'reqId'`

- The name for the property on the request object to set the request id.

**`logName`** Default: `'req_id'`

- The name for the request id in the log output.

**`obscureHeaders`** Default: `null`

- Set to an array with header nams to remove them from log output.

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
