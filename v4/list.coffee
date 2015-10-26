{html} = require './elmish'
R = require 'ramda'

propNeq = R.curry (key, value, obj) -> not R.propEq(key, value, obj)
evolveWhere = R.curry (cond, evo, list) -> R.adjust(evo, R.findIndex(cond, list), list)

removeable = (view, remove) -> (dispatch, model) ->
  html.div {},
    view(dispatch, model)
    html.button
      onClick: remove
      'X'

wrapEffects = (effects, id) ->
  effects?.map (p) ->
    p.then (action) -> {type: 'child', id, action}

listOf = (kind) ->

  init = -> {model: {list: [], nextId: 0}}

  update = (action, model) ->
    switch action.type
      when 'insert'
        id = model.nextId
        newKind = kind.init()
        nextModel = R.evolve({
          list: R.append({id, model: newKind.model})
          nextId: R.inc
        }, model)
        return {
          model: nextModel
          effects: wrapEffects(newKind.effects, id)
        }
      when 'remove'
        return {
          model: R.evolve
            list: R.filter propNeq('id', action.id)
          , model
        }
      when 'child'
        index = model.list.findIndex(R.propEq('id', action.id))
        if model.list[index]?.model
          nextKind = kind.update(action.action, model.list[index].model)
          nextModel = R.evolve({
            list: R.update(index, {id: action.id, model: nextKind.model})
          }, model)
          return {
            model: nextModel
            effects: wrapEffects(nextKind.effects, action.id)
          }
        else
          return {model}
      else return {model}

  view = (dispatch, model) ->
    html.div {},
      html.button
        onClick: -> dispatch {type:'insert'}
        '+'
      model.list.map (item) ->
        # could use R.pipe here if we want
        forward = (action) -> dispatch {type: 'child', id: item.id, action}
        remove = () -> dispatch {type: 'remove', id: item.id}
        removeable(kind.view, remove)(forward, item.model)

  return {init, update, view}

module.exports = listOf
        