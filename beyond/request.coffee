R = require 'ramda'

###
Req.request
  service: String
  resource: Anything
  onSuccess: Something with R.__
  onError: Something with R.__
###

# We can have multiple requests for the same resource.
request = R.curry ({service, resource, onSuccess, onError}) -> 
  service: service
  resource: resource
  onSuccess: [onSuccess]
  onError: [onError]

map = R.curry (fn, {service, resource, onSuccess, onError}) -> 
  service: service
  resource: resource
  onSuccess: R.map(fn, onSuccess)
  onError: R.map(fn, onError)

equals = R.curry (x, y) -> 
  R.equals(x.service, y.service) and R.equals(x.resource, y.resource)

merge = R.curry (x, y) -> 
  service: x.service
  resource: x.resource
  onSuccess: R.dropRepeats(R.concat(x.onSuccess, y.onSuccess))
  onError: R.dropRepeats(R.concat(x.onError, y.onError))

append = R.curry (item, list) ->
  i = R.findIndex(equals(item), list)
  if i is -1
    return R.append(item, list)
  else
    return R.adjust(merge(item), i, list)

flatten = (requests) -> R.reduce(R.flip(append), [], requests)
concat = R.curry (req1, req2) -> flatten(R.concat(req1, req2))
none = -> []

remove = R.curry (item, list) -> R.filter(R.complement(equals)(item), list)  
# x - y
diff = R.curry (x, y) -> R.reduce(R.flip(remove), x, y) 

__ = {"response-placeholder": true}

# XXX Not sure how to trampoline this.
complete = R.curry (payload, actionField) ->
  kind = Object.prototype.toString.apply(actionField)
  if actionField is __
    return payload
  else if kind is '[object Array]' or kind is '[object Object]'
    return R.map(complete(payload), actionField)
  else
    return actionField
    
success = R.curry (req, payload) ->
  R.map(complete(payload), req.onSuccess)

error = R.curry (req, payload) ->
  R.map(complete(payload), req.onError)
    
module.exports = {
  request
  map
  equals
  merge
  append
  flatten
  concat
  none
  remove
  diff
  __
  success
  error
}
  