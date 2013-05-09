# bunyan-middleware

bunyan-middleware

## Usage

```js
var bunyan = require('bunyan')
  , connect = require('connect')
  , bunyanMiddleware = require('bunyan-middleware')

var log = bunyan.createLogger({name: 'My App'})
var app = connect()

app.use(bunyanMiddleware(log))
```

## Install

    $ npm install bunyan-middleware

## License

MIT
