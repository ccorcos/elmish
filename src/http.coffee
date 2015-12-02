# polyfills
require('whatwg-fetch')
require('es6-promise').polyfill()

R = require 'ramda'
flyd = require 'flyd'
flyd.lift = require 'flyd/module/lift'
flyd.filter = require 'flyd/module/filter'

###
I've been building this with fundamentally the wrong mindset since I 
copied it over from beyond. The input is a declarative structure of the
data necessary for the UI wrapped within a structure for parsing it back
out the the appropriate components. 

we need to take the structure, find the queries, and map those into
http request. Then make sure we're fetching all those http requests,
and then wrap the results back up into the original object for the ui to
render.


we need some typing here to make this the way it should. perhaps all
requests need to be wrapped in a {$fetch: ['getFeed', {userId}, fields]}
this then gets translated to {$http: ['getFeed', {userId}, fields]}
###


# this should be the whole async everything. I should be doing the fetching and shit here!
# no. I need that structure. This is the key to the entire external api.

# go through the leaves, and translate to http requests. literally the arguments
# of the fetch function. the transform the result as it will be placed into. then we .json().then
# we should definitely change the variable to be loading... perhaps also add metadata
# just to say that its loading. could eventually add $retryCount and stuff. 

# translate your query lingo to actually http fetch requests
middleware = 
  $github: require 'src/github.coffee'



{evolveLeavesWhere} = require 'src/utils.coffee'

http = (middleware, request$) ->

  wares = R.keys(middleware)
  isMiddleware = R.anyPass(R.map(R.has, wares))

  whichMiddleware = (obj) ->
    # find which ware this object has
    R.find(R.has(R.__ , obj), wares)

  translateToFetch = (obj) ->
    middleware[whichMiddleware(obj)](obj)

  fetch$ = flyd.map(evolveLeavesWhere(isMiddleware, translateToFetch), request$)

  # http side-effects return here
  response$ = flyd.stream()

  update = (state, action) ->
    # state  : {requests, cache, data}
    # action : {type: 'fetch', request}
    #        : {type: 'response', result}

    switch action.type
      when 'fetch'

        # as I go through, I want to
        # - return the proper data object
        # - execute any possible side-effects
        # - mutate the cache

        # use a transducer!!

        # findAllRequests
        # diffRequests
        # cleanUpCache
        # sendNewRequests
        # wrapUpResults





        requests = []

        data = evolveLeavesWhere(
          isMiddleware,
          (request) ->
            {$fetch:{request:[url, options], transform}} = request
            requests.push(request)

            key = JSON.stringify(request)
            value = state.cache[key]
            if value then return value

            value = {$pending: true}
            state.cache[key] = value
            fetch(url, options)
              .then(transform)
              .then  (result) -> response$({type:'recieve', result})
              .catch (result) -> response$({type:'recieve', result})

            return value
          action.request
        )


        # save the requests so we can keep have fine-grained control over what
        # has changed from before and clean up assets in the cache.
        requests: requests
        # keep track of the cache of all requests including number of retries
        # the data result, any errors
        cache: cache
        # we dont need to remember the data we send to the ui, but we need
        # to get it out of here somehow so we'll map over this stream to get
        # it out.

        data:
          forEachRequest
            findInCache or sendRequest



      when 'response'
        


  # something takes the fetch$ objects
  # divy them into all their individual requests
  # if they arent cached or in progess, then send them off
  # 


  # we have the data in the cache and we translate the data to the output

  flyd.map( )
  # input: data, 
  # output data,
  update = (state, action) ->

    switch action.type
      when 'fetch'

    state = 
      cache: {[request]: result}









update = ({cache, pending, fetch}, action) ->
  switch action.type
    when 'request'
      key = JSON.stringify(action.request)
      if cache[key] or pending[key]
        return {
          cache, 
          pending, 
          fetch: null
        }
      else
        return {
          cache, 
          pending: R.assoc(key, true, pending), 
          fetch: action.request
        }
    when 'recieve'
      key = JSON.stringify(action.request)
      return {
        cache: R.assoc(key, action.data, cache)
        pending: R.dissoc(key, pending)
        fetch: null
      }
    else
      return {
        cache,
        pending,
        fetch: null
      }

toRequest = (request) ->
  type: 'request'
  request: request

send = (recieve$) -> (state) ->
  if state.fetch
    [method, url] = request = state.fetch
    fetch(url, {method})
      .then (response) -> response.json()
      .then  (payload) -> recieve$ {type: 'recieve', request, data: {result: payload}}
      .catch (payload) -> recieve$ {type: 'recieve', request, data: {error: payload}}

http = (request$) ->
  recieve$ = flyd.stream()
  action$ = flyd.merge(flyd.map(toRequest, request$), recieve$)
  state$ = flyd.scan(update, {cache: {}, pending: {}, fetch:null}, )
  flyd.on(send(recieve$), state$)



# send a request and recieve a payload wrapped in an http action
send = (receive$) -> (request) ->
  

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