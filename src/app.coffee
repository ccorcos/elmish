R = require 'ramda'
html = require('react').DOM

require 'src/main.styl'

splitView = require 'src/split-view.coffee'
followingList = require 'src/following-list.coffee'
tweetList = require 'src/tweet-list.coffee'

cond = (a,b,c) -> if a then b() else c?()

init = () ->
  selected: null

fetch = (state) ->
  cond state.selected, 
    ->
      users: followingList.fetch()
      tweets: tweetList.fetch(state.selected)
    ->
      users: followingList.fetch()

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
      users: data.users
    content: cond state.selected,
      ->
        tweetList(data.tweets)
      ->
        html.div
          className: 'nothing'
          'Please select a user from the list on the left.'


module.exports = {init, fetch, update, view}