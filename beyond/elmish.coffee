React = require 'react'
ReactDOM = require 'react-dom'
flyd = require 'flyd'
R = require 'ramda'
Req = require './request'
bind = require './bind'

###
A real app is going to have side-effects. I couldn't get this
to work with RxJS but thats probably a better way of going about
this. The you can also have inputs and merge them with the actions
so the app can recieve data externally via websockets.
init     : () -> {state, requests}
update   : (state, action) -> {state, requests}
view     : (dispatch, state) -> html
services : name: {request$, response$}
request$ : ~> [ request ]
response$ : ~> [ action ]
###

mergeAll = (list) ->
  if list.length is 0 then return flyd.stream()
  if list.length is 1 then return flyd.stream list, -> list[0]()
  R.reduce(flyd.merge, list[0], list[1...])

toSingleton = (x) -> [x]

# route request to service
routeToServices = (services) -> (reqs) ->
  serviceReqs = R.groupBy(R.prop('service'), reqs)
  toService = (name) -> 
    services[name].request$(serviceReqs[name])
  R.map(toService, R.keys(serviceReqs))
  
updateStep = (update) -> ({state, requests}, action) ->
  next = update(state, action)
  state: next.state
  requests: Req.concat(requests, next.requests)

updateAll = (update) -> ({state}, actions) ->
  R.reduce(updateStep(update), {state, requests:[]}, actions)

start = ({init, view, update}, services={}) ->
  dispatch$ = flyd.stream()
  response$ = mergeAll(R.values(R.map(R.prop('response$'), services)))
  action$ = flyd.merge(flyd.map(toSingleton, dispatch$), response$)
  model$ = flyd.scan(updateAll(update), init(), action$)
  state$ = flyd.map(R.prop('state'), model$)
  request$ = flyd.map(R.prop('requests'), model$)
  flyd.on(routeToServices(services), request$)
  html$ = flyd.map(R.curry(view)(dispatch$), state$)
  {action$, state$, html$}

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  start
  R
  flyd
  Req
  bind
}

