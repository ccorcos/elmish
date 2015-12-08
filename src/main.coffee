# R = require 'ramda'
# start = require 'src/elmish.coffee'
# app = require 'src/app.coffee'
# http = require 'src/http.coffee'


# translate = require 'src/translate.coffee'
# middleware = 
#   $github: require 'src/github.coffee'

# port = R.pipe(
#   translate(middleware),
#   http
# )

# start(app, port)



R = require 'ramda'
start = require 'src/elmish3.coffee'
app = require 'src/app.coffee'
translate = require 'src/translate2.coffee'
github = require 'src/github.coffee'
http = require 'src/http3.coffee'


api = translate({$github: github})

start(app, http, api)
