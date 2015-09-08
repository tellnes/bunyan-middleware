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
    , requestStart = options.requestStart || false
    , verbose = options.verbose || false
    , parentRequestSerializer = logger.serializers &&
                                logger.serializers.req ||
                                logger.constructor.stdSerializers.req

  if (obscureHeaders && obscureHeaders.length) {
    obscureHeaders = obscureHeaders.map(function (name) {
      return name.toLowerCase()
    })
  } else {
    obscureHeaders = false
  }

  function requestSerializer(req) {
    req = parentRequestSerializer(req)

    if (req && req.headers) {
      var headers = {}
      Object.keys(req.headers).forEach(function (name) {
        headers[name] = req.headers[name]
      })

      for (var i = 0; i < obscureHeaders.length; i++) {
        headers[ obscureHeaders[i] ] = null
      }

      req.headers = headers
    }

    return req
  }

  logger = logger.child(
    { serializers:
      { req: obscureHeaders ? requestSerializer : parentRequestSerializer
      , res: logger.serializers && logger.serializers.res || logger.constructor.stdSerializers.res
      }
    }
  )

  return function (req, res, next) {
    var id = req[propertyName]
          || req.headers[headerNameLower]
          || uuid.v4()

    var start = Date.now()

    var prefs = {}
    prefs[logName] = id
    req.log = res.log = logger.child(prefs, true)

    req[propertyName] = res[propertyName] = id
    res.setHeader(headerName, id)

    if (requestStart || verbose) {
      var reqStartData = { req: req }
      if (verbose) reqStartData.res = res
      req.log.info(reqStartData, 'request start')
    }
    res.on('finish', function() {
      var reqFinishData =
        { res: res
        , duration: Date.now() - start
        }
      if (!requestStart || verbose) reqFinishData.req = req
      res.log.info(reqFinishData, 'request finish')
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
