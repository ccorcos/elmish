{html, flyd} = require './elmish'

undo = ({past, present, future}) ->
  if past.length > 0
    past: past.slice(0, past.length - 1)
    present: past[past.length - 1]
    future: [present].concat(future)
  else
    {past, present, future}

redo = ({past, present, future}) ->
  if future.length > 0
    past: past.concat(present)
    present: future[0],
    future: future.slice(1)
  else
    {past, present, future}

toChangeAction = (action) -> {type: 'change', action}

change = (effect$, {past, present, future}, update, action) ->
  model = update(flyd.forwardTo(effect$, toChangeAction), present, action)
  past: past.concat(present)
  present: model
  future: []

# kind = {init, view, update}
undoable = (kind) ->

  # init : (effect$) -> model
  init = (effect$) -> 
    past: []
    present: kind.init(effect$)
    future: []

  # update : (effect$, model, action) -> model
  update = (effect$, model, action) ->
    switch action.type
      when 'undo' then return undo(model)
      when 'redo' then return redo(model)
      when 'change' then return change(effect$, model, kind.update, action.action)
      else return model

  # view : (dispatch$, model) -> html
  view = (dispatch$, model) ->
    html.div {},
      html.button
        disabled: model.past.length is 0
        onClick: -> dispatch$ {type:'undo'}
        'undo'
      html.button
        disabled: model.future.length is 0
        onClick: -> dispatch$ {type:'redo'}
        'redo'
      kind.view(flyd.forwardTo(dispatch$, toChangeAction), model.present)

  return {init, update, view}

module.exports = undoable