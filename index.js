var uuid = require('node-uuid')

module.exports = function (options) {

  if (options.constructor && options.constructor.name === 'Logger')
    options = { logger: options }

  if (!options.logger)
    throw new Error('`options.logger` is required')

  var logger = options.logger
    , headerName = options.headerName || 'X-Request-Id'
    , headerNameLower = headerName.toLowerCase()
    , propertyName = options.propertyName || 'reqId'
    , logName = options.logName || 'req_id'
    , obscureHeaders = options.obscureHeaders

  function requestSerializer(req) {
    if (!req || !req.connection) return req

    var headers
    if (obscureHeaders) {
      headers = {}
      Object.keys(req.headers).forEach(function (name) {
        headers[name] = req.headers[name]
      })

      for (var i = 0; i < obscureHeaders.length; i++) {
        headers[ obscureHeaders[i] ] = null
      }
    } else {
      headers = req.headers
    }

    var ret =
      { method: req.method
      , url: req.url
      , headers: headers
      , remoteAddress: req.connection.remoteAddress
      , remotePort: req.connection.remotePort
      }

    return ret
  }

  logger = logger.child(
    { serializers:
      { req: requestSerializer
      , res: logger.constructor.stdSerializers.res
      }
    }
  )

  return function (req, res, next) {
    var id = req[propertyName]
          || req.headers[headerNameLower]
          || uuid.v1()

    var start = Date.now()

    var prefs = {}
    prefs[logName] = id
    req.log = res.log = logger.child(prefs, true)

    req[propertyName] = res[propertyName] = id
    res.setHeader(headerName, id)

    req.log.info('request start')
    res.on('finish', function() {
      res.log.info(
          { res: res
          , req: req
          , duration: Date.now() - start
          }
        , 'request finish'
        )
    })

    next()
  }
}
