require 'whatwg-fetch' # window.fetch polyfill 
React = require 'react'
ReactDOM = require 'react-dom'
flyd = require 'flyd'
R = require 'ramda'

###
The simple app does not have any side-effects.
init    : () -> model
update  : (model, action) -> model
view    : (dispatch, model) -> html
###

simple = ({init, view, update}) ->
  action$ = flyd.stream()
  model$ = flyd.scan(update, init(), action$)
  html$ = flyd.map(R.curry(view)(action$), model$)
  {action$, model$, html$}

###
A real app is going to have side-effects. I couldn't get this
to work with RxJS but thats probably a better way of going about
this. The you can also have inputs and merge them with the actions
so the app can recieve data externally via websockets.
init    : () -> {model, effect}
effects : [ Promise, ... ]
update  : (model, action) -> {model, effects}
view    : (dispatch, model) -> html
inputs  : [ flyd.stream ]
###

start = ({init, view, update}, inputs=[]) ->
  dispatch$ = flyd.stream()
  action$ = R.reduce(flyd.merge, dispatch$, inputs)

  updateStep = ({model, effects}, action) ->
    {model, effects} = update(model, action)
  modelAndEffects$ = flyd.scan(updateStep, init(), action$)

  model$ = flyd.stream [modelAndEffects$], -> 
    modelAndEffects$().model
  effect$ = flyd.stream [modelAndEffects$], -> 
    modelAndEffects$().effects

  # wire up the side-effects
  dispatchEffects = (effects=[]) ->
    effects.map(dispatch$)
  flyd.on(dispatchEffects, effect$)

  html$ = flyd.map(R.curry(view)(dispatch$), model$)
  {action$, model$, html$}

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  simple
  start
  curryN: R.curryN
}

