R = require 'ramda'
flyd = require 'flyd'

watch = (obj) ->
  log = (value, key) ->
    flyd.on(console.log.bind(console, key), value)
  R.mapObjIndexed(log, obj)
  
module.exports = watch
