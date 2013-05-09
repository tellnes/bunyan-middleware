var bunyan = require('bunyan')
  , connect = require('connect')
  , bunyanMiddleware = require('./')

var log = bunyan.createLogger({name: 'My App'})

var app = connect()

app.use(bunyanMiddleware(log))
