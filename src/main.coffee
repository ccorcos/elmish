R = require 'ramda'
start = require 'src/elmish.coffee'
app = require 'src/app.coffee'
http = require 'src/http.coffee'
middleware = 
  $github: require 'src/github.coffee'

watch = require 'src/watch.coffee'

port = http(middleware, watch)
start(app, port, watch)


###
ELMISH TODO:

- high-order stream for extended caching
- meteor subscribe and unsubscribe

- time travel high order component
- monitor for watching values

- ui monitor
  - time travel!
- multiple window panes

- compile to js!

UI TODO
- responsive split-view
- swipe split-view
- additive animations!

###

