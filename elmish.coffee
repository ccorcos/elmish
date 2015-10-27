require 'whatwg-fetch' # window.fetch polyfill 
React = require 'react'
ReactDOM = require 'react-dom'
flyd = require 'flyd'
flyd.forwardTo = require 'flyd/module/forwardTo'
R = require 'ramda'

###
The simple app does not have any side-effects.
init    : () -> model
update  : (model, action) -> model
view    : (dispatch$, model) -> html
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
init    : (effect$) -> model
update  : (effect$, model, action) -> model
view    : (dispatch$, model) -> html
inputs  : [ flyd.stream ]
###

mergeAll = (list) ->
  if list.length is 0 then return flyd.stream()
  if list.length is 1 then return flyd.stream list -> list[0]()
  R.reduce(flyd.merge, list[0], list[1...])

start = ({init, view, update}, inputs=[]) ->
  dispatch$ = flyd.stream()
  effect$ = flyd.stream()
  action$ = mergeAll(inputs.concat([dispatch$, effect$]))
  model$ = flyd.scan(R.curry(update)(effect$), init(effect$), action$)
  html$ = flyd.map(R.curry(view)(dispatch$), model$)
  {action$, model$, html$}

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  simple
  start
  R
  flyd
}

