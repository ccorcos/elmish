###
A view consists of the following methods
init    : () -> state
update  : (state, action) -> state
view    : (state, tick, data, callback) -> html
fetch   : (state) -> fragment
animate : (state, tick) -> tick
###

R = require 'ramda'
ReactDOM = require('react-dom')
render = (x) -> ReactDOM.render(x, document.getElementById('root'))
html = require('react').DOM

require 'src/main.styl'

splitView = require 'src/split-view.coffee'
followingList = require 'src/following-list.coffee'

init = () ->
  selected: null

fetch = (state) ->
  followingList.fetch()

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
      users: data
    content: html.div({}, "content")

# elmish

# TODO
# app.coffee and elmish.coffee and http.coffee and twitter.coffee
# make streams for everything
# http library for fetching
# get list paging to work with state and infinite scrolling
# fetch twitter feed as well
# multiple twitter feeds in two panes -- how to divvy up the data?
# responsive split view
# swipe split view
# additive animations