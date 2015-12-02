R = require 'ramda'

isObject = (x) -> Object.prototype.toString.apply(x) is '[object Object]'
isArray = (x) -> Object.prototype.toString.apply(x) is '[object Array]'

evolveLeavesWhere = R.curry (fn, ev, obj) ->
  parseGraph = (value) ->
    if fn(value) 
      ev(value)
    else if isObject(value)
      R.mapObj(parseGraph, value)
    else if isArray(value)
      R.map(parseGraph, value)
    else value
  R.mapObj(parseGraph, obj)

module.exports = {
  isObject
  isArray
  evolveLeavesWhere
}