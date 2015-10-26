{html} = require './elmish'
R = require 'ramda'

propNeq = R.curry (key, value, obj) -> not R.propEq(key, value, obj)
evolveWhere = R.curry (cond, evo, list) -> R.adjust(evo, R.findIndex(cond, list), list)

removeable = (view, remove) -> (address, model) ->
  html.div {},
    view(address, model)
    html.button
      onClick: remove
      'X'

listOf = (kind) ->

  init = -> {model: {list: [], nextId: 0}}

  update = (action, model) ->
    console.log "action", action.type
    switch action.type
      when 'insert'
        newItem = kind.init()
        return model: R.evolve
            list: R.append {id: model.nextId, model: newItem.model}
            nextId: R.inc
          , model
          effects: newItem.effects?.map (promise) ->
            promise.then (action) -> {type: 'child', id: item.id, action}
      when 'remove'
        return model: R.evolve
            list: R.filter propNeq('id', action.id)
          , model
      when 'child'
        index = list.findIndex(R.propEq('id', action.id))
        newItem = kind.update(action.action, model.list[index])
        item = {id: action.id, model: newItem.model}
        return model: R.evolve
            list: R.update(index, newItem)
          , model
          effects: newItem.effects?.map (promise) -> 
            promise.then (action) -> {type: 'child', id: item.id, action}
      else return {model}

  view = (address, model) ->
    html.div {},
      html.button
        onClick: -> 
          console.log "CLICK"
          address {type:'insert'}
        '+'
      model.list.map (item) ->
        # could use R.pipe here if we want
        forward = (action) -> address {type: 'child', id: item.id, action}
        remove = () -> address {type: 'remove', id: item.id}
        removeable(kind.view, remove)(forward, item.model)

  return {init, update, view}

module.exports = listOf
        