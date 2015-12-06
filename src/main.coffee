R = require 'ramda'
start = require 'src/elmish.coffee'
app = require 'src/app.coffee'
http = require 'src/http.coffee'
middleware = 
  $github: require 'src/github.coffee'

watch = require 'src/watch.coffee'

port = http(middleware, watch)
start(app, port, watch)

