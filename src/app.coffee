R = require 'ramda'
html = require('react').DOM

require 'src/main.styl'

splitView = require 'src/split-view.coffee'
followingList = require 'src/following-list.coffee'
starList = require 'src/star-list.coffee'

cond = (a,b,c) -> if a then b() else c?()

init = () ->
  selected: null

effect = (state) ->
  cond state.selected, 
    ->
      users: followingList.effect()
      stars: starList.effect(state.selected)
    ->
      users: followingList.effect()

update = (state, action) ->
  switch action.type
    when "select_user"
      return R.assoc('selected', action.id, state)
    else
      return state

view = (dispatch, state, data) ->
  splitView
    sidebar: followingList.view
      selected: state.selected
      select: (id) -> dispatch({type: 'select_user', id})
      data: data.users
    content: cond state.selected,
      ->
        starList.view(data.stars)
      ->
        html.div
          className: 'nothing'
          'Please select a user from the list on the left.'


module.exports = {init, effect, update, view}