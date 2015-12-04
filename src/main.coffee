start = require 'src/elmish.coffee'
app = require 'src/app.coffee'
http = require 'src/http.coffee'
middleware = 
  $github: require 'src/github.coffee'

start(app, http(middleware, monitor))

flyd = require 'flyd'

monitor = ({effect$, response$, http$, action$, data$}) ->
  log = console.log.bind(console, 'effect$')
  flyd.on(log, effect$)
  log = console.log.bind(console, 'data$')
  flyd.on(log, data$)

###
ELMISH TODO:

- high-order stream for extended caching
- meteor subscribe and unsubscribe
- ui monitor
  - time travel!
- multiple window panes

UI TODO
- responsive split-view
- swipe split-view
- additive animations!

###

