{html, flyd} = require './elmish'

# make sure the promised action makes it back to the child
toChildAction = (id) -> (action) -> {type: 'child', id, action}

insert = (effect$, model, init) ->
  id = model.nextId
  childModel = init(flyd.forwardTo(effect$, toChildAction(id)))
  item = {id, model: childModel}
  list: [item].concat(model.list)
  nextId: model.nextId + 1

remove = (model, id) ->
  list: model.list.filter (item) -> item.id isnt id
  nextId: model.nextId

updateChild = (effect$, model, id, action, update) ->
  list: model.list.map (item) -> 
    if item.id is id 
      return {id, model: update(flyd.forwardTo(effect$, toChildAction(id)), item.model, action)}
    else
      return item
  nextId: model.nextId

# kind = {init, view, update}
listOf = (kind) ->

  # init : (effect$) -> model
  init = (effect$) -> {list: [], nextId: 0}

  # update : (effect$, model, action) -> model
  update = (effect$, model, action) ->
    switch action.type
      when 'insert' then return insert(effect$, model, kind.init)
      when 'remove' then return remove(model, action.id)
      when 'child' then return updateChild(effect$, model, action.id, action.action, kind.update)
      else return model

  # view : (dispatch$, model) -> html
  view = (dispatch$, model) ->
    html.div {},
      html.button
        onClick: -> dispatch$ {type:'insert'}
        '+'
      model.list.map (item) ->
        html.div {},
          kind.view(flyd.forwardTo(dispatch$, toChildAction(item.id)), item.model)
          html.button
            onClick: -> dispatch$ {type: 'remove', id: item.id}
            'X'

  return {init, update, view}

module.exports = listOf
        