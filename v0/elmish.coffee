React = require 'react'
ReactDOM = require 'react-dom'

html = React.DOM
{render} = ReactDOM

start = ({init, view, update}) ->
  renderLoop = (state) ->
    dispatch = (action) -> renderLoop(update(action, state))
    render view(dispatch, state), document.getElementById('root')
  renderLoop(init())

module.exports = {
  html
  start
}