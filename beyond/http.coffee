require 'whatwg-fetch'
R = require 'ramda'
flyd = require 'flyd'
flyd.filter = require 'flyd/module/filter'
Req = require './request'

# HTTP Service modeled after window.fetch and assumes json responses
# https://github.com/github/fetch

# send a request and recieve a payload wrapped in an http action
send = (receive$) -> (request) ->
  fetch(request.resource.url, request.resource.options)
    .then (response) -> response.json()
    .then (payload) -> receive$ {type: 'http-success', request, payload}
    .catch (payload) -> receive$ {type: 'http-error', request, payload}

# outbox is a list of requests that need to be sent
# pending is a list of requests that are in flight
# inbox are responses to requests.
update = ({pending}, action) ->
  switch action.type
    when 'http-request'
      pending: Req.concat(action.requests, pending)
      inbox: []
      outbox: Req.diff(action.requests, pending)
    when 'http-success'
      # put the payload in place of R.__ in the action prototypes
      # and output the actions
      request = R.find(Req.equals(action.request), pending)
      pending: Req.remove(action.request, pending)
      inbox: Req.success(request, action.payload)
      outbox: []
    when 'http-error'
      # put the payload in place of R.__ in the action prototypes
      # and output the actions
      request = R.find(Req.equals(action.request), pending)
      pending: Req.remove(action.request, pending)
      inbox: Req.error(request, action.payload)
      outbox: []
    else
      pending: pending
      inbox: []
      outbox: []

nonEmpty = (x) -> x.length > 0
toHttpRequest = (requests) -> {type: 'http-request', requests}

module.exports = do ->
  # a stream of requests
  request$ = flyd.stream()
  # a stream of responses
  receive$ = flyd.stream()
  # actions for the http service to respond to
  action$ = flyd.merge(flyd.map(toHttpRequest, request$), receive$)
  # initial model
  init = {pending:[], inbox:[], outbox: []}
  # handle the actions
  model$ = flyd.scan(update, init, action$)
  # stream of pending requests
  pending$ = flyd.map(R.prop('pending'), model$)
  # stream of actoins that the app is interested in
  response$ = flyd.filter(nonEmpty, flyd.map(R.prop('inbox'), model$))
  # send the requests in the outbox
  R.pipe(
    R.curry(flyd.map)(R.prop('outbox'))
    R.curry(flyd.filter)(nonEmpty)
    R.curry(flyd.on)(R.map(send(receive$)))
  )(model$)
    
  {
    request$
    receive$
    action$
    response$
    pending$
  }

  
  