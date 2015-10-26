React = require 'react'
ReactDOM = require 'react-dom'
require 'whatwg-fetch' # window.fetch polyfill 

# init    : () -> {model, effect}
# effects : [ Promise ]
# update  : (action, model) -> {model, effects}
# view    : (dispatch, model) -> html

window.actions = actions = []

scan = (reducer, {model, effects}, callback) ->
  dispatch = (action) ->
    console.log "ACTION " + JSON.stringify(action)
    actions.push(action)
    {model, effects} = reducer(action, model)
    effects?.map (p) -> p.then(dispatch).catch(dispatch)
    callback(dispatch, model)
  effects?.map (p) -> p.then(dispatch).catch(dispatch)
  return dispatch

renderLoop = (view) -> (dispatch, model) ->
  console.log "RENDER " + JSON.stringify(model)
  ReactDOM.render view(dispatch, model), document.getElementById('root')

start = ({init, update, view}) ->
  {model, effects} = init()
  renderView = renderLoop(view)
  dispatch = scan(update, {model, effects}, renderView)
  renderView(dispatch, model)

module.exports = {
  html: React.DOM
  start
}