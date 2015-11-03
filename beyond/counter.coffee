{html, bind, noReqs} = require './elmish'

# init : () -> {state, requests}
init = noReqs () -> 0

# update : (state, action) -> {state, requests}
update = noReqs (state, action) ->
  switch action.type
    when 'increment' then return state + 1
    when 'decrement' then return state - 1
    else return state

# view : (dispatch, state) -> html
view = (dispatch, state) ->
  html.div
    style: display: 'flex'
    html.button
      onClick: bind([{type: 'decrement'}], dispatch)
      '-'
    html.div
      style:
        fontSize: 20
        textAlign: 'center'
        width: 50
      state
    html.button
      onClick: bind([{type: 'increment'}], dispatch)
      '+'

module.exports = {init, update, view}
