{html} = require './elmish'

init = (state=0) -> state

update = (action, state) ->
  switch action.type
    when 'increment' then return state + 1
    when 'decrement' then return state - 1
    else return state

view = (dispatch, state) ->
  html.div {},
    html.button
      onClick: -> dispatch {type: 'decrement'}
      '-'
    html.div
      style: fontSize: 20, fontFamily: 'monospace'
      state
    html.button
      onClick: -> dispatch {type: 'increment'}
      '+'

module.exports = {init, update, view}