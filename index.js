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

  logger = logger.child({ serializers: logger.constructor.stdSerializers })

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
