{html} = require './elmish'

undo = ({past, present, future}) ->
  if past.length > 0
    model:
      past: past.slice(0, past.length - 1)
      present: past[past.length - 1]
      future: [present].concat(future)
  else
    model: {past, present, future}

redo = ({past, present, future}) ->
  if future.length > 0
    model:
      past: past.concat(present)
      present: future[0],
      future: future.slice(1)
  else
    model: {past, present, future}

# make sure the promised action makes it back to the child
wrapEffects = (effects) ->
  effects?.map (p) ->
    p.then (action) -> {type: 'change', action}

change = ({past, present, future}, childUpdate, childAction) ->
  {model, effects} = childUpdate(present, childAction)
  model:
    past: past.concat(present)
    present: model
    future: []
  effects: wrapEffects(effects)

# kind = {init, view, update}
undoable = (kind) ->

  # init : () -> {model, effects}
  init = -> 
    {model, effects} = kind.init()
    model:
      past: []
      present: model
      future: []
    effects: effects

  # update : (model, action) -> {model, effects}
  update = (model, action) ->
    switch action.type
      when 'undo' then return undo(model)
      when 'redo' then return redo(model)
      when 'change' then return change(model, kind.update, action.action)
      else return {model}

  # view : (dispatch, model) -> html
  view = (dispatch, model) ->
    onChange = (action) -> dispatch {type: 'change', action}
    html.div {},
      html.button
        disabled: model.past.length is 0
        onClick: -> dispatch {type:'undo'}
        'undo'
      html.button
        disabled: model.future.length is 0
        onClick: -> dispatch {type:'redo'}
        'redo'
      kind.view(onChange, model.present)

  return {init, update, view}

module.exports = undoable