{html} = require './elmish'

# init : () -> {model, effects}
init = (model=0) -> {model}

# update : (model, action) -> {model, effects}
update = (model, action) ->
  switch action.type
    when 'increment' then return {model: model + 1}
    when 'decrement' then return {model: model - 1}
    else return {model}

# view : (dispatch, model) -> html
view = (dispatch, model) ->
  html.div
    style: display: 'flex'
    html.button
      onClick: -> dispatch {type: 'decrement'}
      '-'
    html.div
      style:
        fontSize: 20
        textAlign: 'center'
        width: 50
      model
    html.button
      onClick: -> dispatch {type: 'increment'}
      '+'

module.exports = {init, update, view}