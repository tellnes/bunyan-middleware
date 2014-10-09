var uuid = require('node-uuid')

module.exports = function (options, logger) {
  options = options || {}
  logger = logger || options.logger

  if (!logger && options.constructor && options.constructor.name === 'Logger') {
    logger = options
    options = {}
  }

  if (!logger) {
    throw new Error('`logger` is required')
  }

  var headerName = options.headerName || 'X-Request-Id'
    , headerNameLower = headerName.toLowerCase()
    , propertyName = options.propertyName || 'reqId'
    , logName = options.logName || 'req_id'
    , obscureHeaders = options.obscureHeaders

  if (obscureHeaders && obscureHeaders.length) {
    obscureHeaders = obscureHeaders.map(function (name) {
      return name.toLowerCase()
    })
  } else {
    obscureHeaders = false
  }

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
          { req: req
          , res: res
          , duration: Date.now() - start
          }
        , 'request finish'
        )
    })
    res.on('close', function () {
      res.log.warn(
          { req: req
          , res: res
          , duration: Date.now() - start
          }
        , 'request socket closed'
        )
    })

    next()
  }
}
