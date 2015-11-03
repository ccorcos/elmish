React = require 'react'
ReactDOM = require 'react-dom'
flyd = require 'flyd'
R = require 'ramda'
Req = require './request'
bind = require './bind'

###
A service needs to have a request$ and a response$ which 
take lists of requests and respond with lists of actions.
###

###
init     : () -> {state, requests}
update   : (state, action) -> {state, requests}
view     : (dispatch, state) -> html
services : {name: {request$, response$}}
###

# merge a list of flyd streams
mergeAll = (list) ->
  if list.length is 0 then return flyd.stream()
  if list.length is 1 then return flyd.stream list, -> list[0]()
  R.reduce(flyd.merge, list[0], list[1...])

toSingleton = (x) -> [x]

# route requests to the proper services
routeToServices = (services) -> (reqs) ->
  reqsByService = R.groupBy(R.prop('service'), reqs)
  toService = (name) -> 
    services[name].request$(reqsByService[name])
  R.map(toService, R.keys(reqsByService))

# update based on a single actions, accumulating requests from the
# previous actions.
updateStep = (update) -> ({state, requests}, action) ->
  next = update(state, action)
  state: next.state
  requests: Req.concat(requests, next.requests)

# update based on a list of actions starting with no requests.
updateAll = (update) -> ({state}, actions) ->
  R.reduce(updateStep(update), {state, requests:[]}, actions)

# start the app with associated services
start = ({init, view, update}, services={}) ->
  # internal view actions
  dispatch$ = flyd.stream()
  # responses from services
  response$ = mergeAll(R.values(R.map(R.prop('response$'), services)))
  # action stream that updates the model
  action$ = flyd.merge(flyd.map(toSingleton, dispatch$), response$)
  # update the model with batches of actions
  model$ = flyd.scan(updateAll(update), init(), action$)
  # the model update returns requests and state
  state$ = flyd.map(R.prop('state'), model$)
  request$ = flyd.map(R.prop('requests'), model$)
  # route the requests to the appropriate services
  flyd.on(routeToServices(services), request$)
  # build the appropriate view wired up to dispatch
  html$ = flyd.map(R.curry(view)(dispatch$), state$)
  # return any interesting streams to inspect
  {action$, state$, html$, services}

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  start
  R
  flyd
  Req
  bind
}

