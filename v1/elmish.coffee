# https://github.com/evancz/start-app/blob/2.0.1/src/StartApp.elm

React = require 'react'
ReactDOM = require 'react-dom'

html = React.DOM
{render} = ReactDOM

scan = (reducer, {state, effects}, callback) -> 
  dispatch = (action) ->
    console.log action
    {state, effects} = reducer(action, state)
    effects?.then(dispatch)
    callback(dispatch, state)
  effects?.then(dispatch)

renderLoop = (view) -> (dispatch, state) ->
  console.log 'render', state
  render view(dispatch, state), document.getElementById('root')

start = ({init, view, update}) ->
  {state, effects} = init()
  renderView = renderLoop(view)
  dispatch = scan(update, {state, effects}, renderView)
  renderView(dispatch, state)

module.exports = {
  html
  start
}