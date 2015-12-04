R = require 'ramda'

isObject = (x) -> Object.prototype.toString.apply(x) is '[object Object]'
isArray = (x) -> Object.prototype.toString.apply(x) is '[object Array]'

# parse through a JSON graph to find leaves with that pass the fn condition
# and evolve the those values.
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

# parse through a JSON graph to find leaves with that pass the fn condition
# and return a list of those value
leavesWhere = R.curry (fn, obj) ->
  leaves = []
  parseGraph = (value) ->
    if fn(value)
      leaves.push(value)
    else if isObject(value)
      R.mapObj(parseGraph, value)
    else if isArray(value)
      R.map(parseGraph, value)
    return
  R.mapObj(parseGraph, obj)
  return leaves

# very helpful for diffing!
vennDiagram = R.curry (a, b) ->
  [R.difference(a, b), R.intersection(a,b), R.difference(b, a)]

module.exports = {
  isObject
  isArray
  evolveLeavesWhere
  leavesWhere
  vennDiagram
}