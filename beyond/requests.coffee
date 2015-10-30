R = require 'ramda'

###
_* are helper functions to act on a single request item.

A request item has a src which denotes which service will
handle this request (e.g. http, websockets) and a query 
for that service. It also has a list of response callbacks
which map into actions of the proper update.
###

# a request of some resource with response callbacks
_request = R.curry (src, query, cb) -> {src, query, responses: [cb]}

_same = R.curry (r1, r2) -> 
  R.equals(r1.src, r2.src) and R.equals(r1.query, r2.query)

# map the function on the responses of the request.
_map = R.curry (fn, req) -> 
  _request req.src, req.query, R.map(fn, req.responses)

_merge = R.curry (r1, r2) -> 
  _request r1.src, r1.query, R.concat(r1.responses, r2.responses)

request = R.curry (src, query, cb) -> [_request(src, query, cb)]

map = R.curry (fn, req) -> R.map(_map(fn), req)

append = R.curry (item, list) ->
  i = R.findIndex(_same(item), list)
  if i is -1
    return R.append(item, list)
  else
    return R.adjust(_merge, i, list)

_flatten = (req) -> R.reduce(append, [], req)

concat = R.curry (req1, req2) ->
  _flatten(R.concat(req1, req2)) 

none = -> []

# Requests
module.exports = {
  request
  map
  append
  concat
}
  