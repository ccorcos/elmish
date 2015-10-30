R = require 'ramda'

compose = (a) -> (b) -> R.compose(a, b)

_request = (src, query, cb) -> {src, query, responses: [cb]}
_map = (fn, req) -> _request(req.src, req.query, req.responses.map(compose(fn)))
_same = (r1, r2) -> R.equals(r1.src, r2.src) and R.equals(r1.query, r2.query)
  
request = (src, query, cb) -> [_request(src, query, cb)]
map = (fn, req) -> req.map (r) -> _map(fn, r)
flatten = (req) ->
  req.reduce (acc)
  
batch = (req1, req2) -> 
  
  
# Requests
module.exports = {request, map}
  