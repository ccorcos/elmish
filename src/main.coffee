R = require 'ramda'
start = require 'src/elmish.coffee'
app = require 'src/app.coffee'
http = require 'src/http.coffee'
translate = require 'src/translate.coffee'

middleware = 
  $github: require 'src/github.coffee'

port = R.pipe(
  translate(middleware),
  http
)

start(app, port)

