{html} = require './elmish'
R = require 'ramda'

propNeq = R.curry (key, value, obj) -> not R.propEq(key, value, obj)
evolveWhere = R.curry (cond, evo, list) -> R.adjust(evo, R.findIndex(cond, list), list)

removeable = (view, remove) -> (dispatch, state) ->
  html.div {},
    view(dispatch, state)
    html.button
      onClick: remove
      'X'

listOf = (kind) ->

  init = -> {list: [], nextId: 0}

  update = (action, state) ->
    switch action.type
      when 'insert' then return R.evolve
        list: R.append {id: state.nextId, state: kind.init()}
        nextId: R.inc
      , state
      when 'remove' then return R.evolve
        list: R.filter propNeq('id', action.id)
      , state
      when 'child' then return R.evolve
        list: evolveWhere R.propEq('id', action.id), ({id, state}) ->
          {id, state: kind.update(action.action, state)}
      , state
      else return state

  view = (dispatch, state) ->
    html.div {},
      html.button
        onClick: -> dispatch {type:'insert'}
        '+'
      state.list.map (item) ->
        # could use R.pipe here if we want
        forward = (action) -> dispatch {type: 'child', id: item.id, action}
        remove = () -> dispatch {type: 'remove', id: item.id}
        removeable(kind.view, remove)(forward, item.state)

  return {init, update, view}

module.exports = listOf
        