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

  return function (req, res, next) {
    var id = req[propertyName]
          || req.headers[headerNameLower]
          || uuid.v1()

    var prefs = {}
    prefs[logName] = id
    req.log = res.log = logger.child(prefs, true)

    req[propertyName] = res[propertyName] = id
    res.setHeader(headerName, id)

    req.log.info({ req: req }, 'start request')
    res.on('finish', function() {
      res.log.info({ res: res }, 'response finish')
    })

    next()
  }
}
