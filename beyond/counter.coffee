{html, bind} = require './elmish'

# init : () -> {state, requests}
init = () ->
  state: 0
  requests: []

# update : (state, action) -> {state, requests}
update = (state, action) ->
  switch action.type
    when 'increment'
      state: state + 1
      requests: []
    when 'decrement'
      state: state - 1
      requests: []
    else
      state: state
      requests: []

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
