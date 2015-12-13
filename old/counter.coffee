{html, R, flyd} = require './elmish'

# init : (effect$) -> model
init = (effect$) -> 0

# update : (effect$, model, action) -> model
update = (effect$, model, action) ->
  switch action.type
    when 'increment' then return model + 1
    when 'decrement' then return model - 1
    else return model

# view : (dispatch$, model) -> html
view = (dispatch$, model) ->
  html.div
    style: display: 'flex'
    html.button
      onClick: flyd.forwardTo(dispatch$, R.always({type: 'decrement'}))
      '-'
    html.div
      style:
        fontSize: 20
        textAlign: 'center'
        width: 50
      model
    html.button
      onClick: flyd.forwardTo(dispatch$, R.always({type: 'increment'}))
      '+'

module.exports = {init, update, view}