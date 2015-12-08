start = require 'src/elmish.coffee'
app = require 'src/app.coffee'
translate = require 'src/translate.coffee'
github = require 'src/github.coffee'
http = require 'src/http.coffee'

api = translate({$github: github})
start(app, http, api)
