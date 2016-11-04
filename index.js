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
    , additionalRequestFinishData = options.additionalRequestFinishData
    , logName = options.logName || 'req_id'
    , obscureHeaders = options.obscureHeaders
    , requestStart = options.requestStart || false
    , verbose = options.verbose || false
    , parentRequestSerializer = logger.serializers && logger.serializers.req
    , level = options.level || 'info'

  if (obscureHeaders && obscureHeaders.length) {
    obscureHeaders = obscureHeaders.map(function (name) {
      return name.toLowerCase()
    })
  } else {
    obscureHeaders = false
  }

  function requestSerializer(req) {
    var obj
    if (parentRequestSerializer) {
      obj = parentRequestSerializer(req)
    } else {
      obj =
        { method: req.method
        , url: req.originalUrl || req.url
        , headers: req.headers
        , query: req.query
        , remoteAddress: req.connection.remoteAddress
        , remotePort: req.connection.remotePort
        }
    }

    if (obscureHeaders && obj.headers) {
      var headers = {}
      Object.keys(obj.headers).forEach(function(name) {
        headers[name] = obj.headers[name]
      })

      for (var i = 0; i < obscureHeaders.length; i++) {
        headers[ obscureHeaders[i] ] = null
      }

      obj.headers = headers
    }

    return obj
  }

  logger = logger.child(
    { serializers:
      { req: requestSerializer
      , res: logger.serializers && logger.serializers.res || logger.constructor.stdSerializers.res
      }
    }
  )

  return function (req, res, next) {
    var id = req[propertyName]
          || req.headers[headerNameLower]
          || uuid.v4()

    var start = process.hrtime()

    var prefs = {}
    prefs[logName] = id
    req.log = res.log = logger.child(prefs, true)

    req[propertyName] = res[propertyName] = id
    res.setHeader(headerName, id)

    if (requestStart || verbose) {
      var reqStartData = { req: req }
      if (verbose) reqStartData.res = res
      req.log[level](reqStartData, 'request start')
    }
    res.on('finish', function() {
      var reqFinishData =
        { res: res
        , duration: getDuration(start)
        }
      if (!requestStart || verbose) reqFinishData.req = req
      if (additionalRequestFinishData) {
        var additionReqFinishData = additionalRequestFinishData(req, res)
        if (additionReqFinishData) {
          Object.keys(additionReqFinishData).forEach(function(name) {
            reqFinishData[name] = additionReqFinishData[name]
          })
        }
      }
      res.log[level](reqFinishData, 'request finish')
    })
    res.on('close', function () {
      res.log.warn(
          { req: req
          , res: res
          , duration: getDuration(start)
          }
        , 'request socket closed'
        )
    })

    next()
  }
}

function getDuration(start) {
  var diff = process.hrtime(start)
  return diff[0] * 1e3 + diff[1] * 1e-6
}
