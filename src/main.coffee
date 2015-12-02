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

start = ({init, view, update, request}) ->
  action$ = flyd.stream()
  state$ = flyd.scan(update, init(), action$)
  fetch$ = flyd.map(fetch, state$)

  # leavesEvolve(R.has('$fetch'), translate)

  # fetch data!

  data$ = flyd.map()
  # I with plumbing like this was easier
  stateAndData$ = flyd.lift(((a,b) -> [a,b]), state$, data$)
  html$ =        flyd.map((([a,b]) -> view(action$, a, b)))
  {action$, state$, html$}

# elmish

# more nested / recursive http parsing
# less naive http caching

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