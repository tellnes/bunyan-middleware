var uuid = require('uuid').v1

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
    , excludeHeaders = options.excludeHeaders
    , requestStart = options.requestStart || false
    , verbose = options.verbose || false
    , filter = options.filter
    , parentRequestSerializer = logger.serializers && logger.serializers.req
    , level = options.level || 'info'

  function processHeaderNames(property) {
    if (property && property.length) {
      return property.map(function(name) { return name.toLowerCase() })
    } else {
      return false
    }
  }

  obscureHeaders = processHeaderNames(obscureHeaders)
  excludeHeaders = processHeaderNames(excludeHeaders)

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

    if (obj.headers && (obscureHeaders || excludeHeaders)) {
      obj.headers = Object.keys(obj.headers).reduce(function(memo, name) {
        if (excludeHeaders && excludeHeaders.includes(name)) {
          return memo
        }

        if (obscureHeaders && obscureHeaders.includes(name)) {
          memo[name] = null
          return memo
        }

        memo[name] = obj.headers[name]
        return memo
      }, {})
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
    if (filter && filter(req, res))
      return next()

    var id = req[propertyName]
          || req.headers[headerNameLower]
          || uuid()

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
