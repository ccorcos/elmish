###
A view consists of the following methods
init    : () -> state
update  : (state, action) -> state
view    : (dispatch, state, data) -> html
fetch   : (state) -> fragment
###

# R = require 'ramda'
# ReactDOM = require('react-dom')
# render = (x) -> ReactDOM.render(x, document.getElementById('root'))
# html = require('react').DOM




###
init    : () -> state
update  : (state, action) -> state
view    : (dispatch, state, data) -> html
fetch   : (state) -> fragment
###

start = ({init, view, update, fetch}) ->
  action$ = flyd.stream()
  state$ = flyd.scan(update, init(), action$)
  request$ = flyd.map(fetch, state$)

  # fetch data!

  html$ = flyd.map(R.curry(view)(action$), state$)
  {action$, state$, html$}

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