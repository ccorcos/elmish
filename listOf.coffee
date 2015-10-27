{html} = require './elmish'

# add a remove button to each view
removeable = (view, onRemove) -> (dispatch, model) ->
  html.div {},
    view(dispatch, model)
    html.button
      onClick: onRemove
      'X'

# make sure the promised action makes it back to the child
wrapEffects = (effects, id) ->
  effects?.map (p) ->
    p.then (action) -> {type: 'child', id, action}

insert = (model, child) ->
  id = model.nextId
  item = {id, model: child.model}
  model:
    list: [item].concat(model.list)
    nextId: model.nextId + 1
  effects: wrapEffects(child.effects, id)

remove = (model, id) ->
  model:
    list: model.list.filter (item) -> item.id isnt id
    nextId: model.nextId

wrapChild = (model, id, childAction, update) ->
  index = model.list.findIndex (item) -> item.id is id
  childModel = model.list[index]?.model
  if childModel isnt undefined
    nextChild = update(childModel, childAction)
    nextList = model.list.slice(0)
    nextList[index] = {id, model:nextChild.model}
    model:
      list: nextList
      nextId: model.nextId
    effects:  wrapEffects(nextChild.effects, id)
  else
    {model}

# kind = {init, view, update}
listOf = (kind) ->

  # init : () -> {model, effects}
  init = -> {model: {list: [], nextId: 0}}

  # update : (model, action) -> {model, effects}
  update = (model, action) ->
    switch action.type
      when 'insert' then return insert(model, kind.init())
      when 'remove' then return remove(model, action.id)
      when 'child' then return wrapChild(model, action.id, action.action, kind.update)
      else return {model}

  # view : (dispatch, model) -> html
  view = (dispatch, model) ->
    html.div {},
      html.button
        onClick: -> dispatch {type:'insert'}
        '+'
      model.list.map (item) ->
        forward = (action) -> dispatch {type: 'child', id: item.id, action}
        onRemove = () -> dispatch {type: 'remove', id: item.id}
        removeable(kind.view, onRemove)(forward, item.model)

  return {init, update, view}

module.exports = listOf
        