require 'whatwg-fetch' # window.fetch polyfill 
React = require 'react'
ReactDOM = require 'react-dom'

###
The simple app does not have any side-effects.
init    : () -> model
update  : (action, model) -> model
view    : (dispatch, model) -> html
###

renderView = (view) -> (dispatch, model) ->
  console.log "MODEL:", model
  ReactDOM.render view(dispatch, model), document.getElementById('root')

simple = do ->
  scan = (update, model, render) ->
    dispatch = (action) -> 
      console.log "ACTION:", action
      model = update(action, model)
      render(dispatch, model)
    render(dispatch, model)

  simple = ({init, view, update}) ->
    render = renderView(view)
    scan(update, init(), render)


###
A real app is going to have side-effects. I couldn't get this
to work with RxJS but thats probably a better way of going about
this. The you can also have inputs and merge them with the actions
so the app can recieve data externally via websockets.
init    : () -> {model, effect}
effects : [ Promise, ... ]
update  : (action, model) -> {model, effects}
view    : (dispatch, model) -> html
###

start = do ->
  dispatchEffects = (dispatch, effects) ->
    effects?.map (p) -> p.then(dispatch).catch(dispatch)

  scan = (update, {model, effects}, render) ->
    dispatch = (action) ->
      console.log "ACTION:", action
      {model, effects} = update(action, model)
      dispatchEffects(dispatch, effects)
      render(dispatch, model)
    dispatchEffects(dispatch, effects)
    render(dispatch, model)

  start = ({init, update, view}) ->
    render = renderView(view)
    scan(update, init(), render)

module.exports = {
  html: React.DOM
  simple
  start
}

