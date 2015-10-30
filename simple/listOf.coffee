{html} = require '../elmish'

insert = (model, child) ->
  item = {id: model.nextId, model: child}
  list: [item].concat(model.list)
  nextId: model.nextId + 1

remove = (model, id) ->
  list: model.list.filter (item) -> item.id isnt id
  nextId: model.nextId

child = (model, id, childAction, update) ->
  list: model.list.map (item) -> if item.id is id then {id, model: update(item.model, childAction)} else item
  nextId: model.nextId

# kind = {init, view, update}
listOf = (kind) ->

  # init : () -> model
  init = -> {list: [], nextId: 0}

  # update : (model, action) -> model
  update = (model, action) ->
    switch action.type
      when 'insert' then return insert(model, kind.init())
      when 'remove' then return remove(model, action.id)
      when 'child' then return child(model, action.id, action.action, kind.update)
      else return model

  # view : (dispatch, model) -> html
  view = (dispatch, model) ->
    html.div {},
      html.button
        onClick: -> dispatch {type:'insert'}
        '+'
      model.list.map (item) ->
        forward = (action) -> dispatch {type: 'child', id: item.id, action}
        onRemove = () -> dispatch {type: 'remove', id: item.id}
        html.div
          style: display: 'flex'
          kind.view(forward, item.model)
          html.button
            style: marginLeft: 5
            onClick: onRemove
            'X'

  return {init, update, view}

module.exports = listOf
        