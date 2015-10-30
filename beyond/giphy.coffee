{html, R, flyd} = require './elmish'
Req = require 'requests'

randomUrl = (topic) -> 
  "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=#{topic}"

requestRandomGif = (topic) ->
  Req.request 'http', {get: randomUrl(topic)}, (error, result) ->
    if error 
      {type: 'errorGif', error} 
    else 
      {type: 'newGif' url: data?.image_url}

# init : () -> {state, request}
init = (topic="cats") -> 
  state: {topic:topic, url: 'loading.gif'}
  request: requestRandomGif(topic)

# update : (state, action) -> {state, request}
update = (state, action) ->
  switch action.type
    when 'newGif'
      state: R.assoc('url', action.url, state)
      request: Req.none
    when 'errorGif' 
      state: R.assoc('url', "error.gif", state)
      request: Req.none
    when 'anotherGif'
      state: R.assoc('url', 'loading.gif', state)
      request: requestRandomGif(state.topic)
    else
      state: state
      request: Req.none

# view : (dispatch$, model) -> html
view = (dispatch$, model) ->
  html.div {},
    html.h2 {}, model.topic
    html.img
      src: model.url
    html.button
      # Same as: onClick: (action) -> dispatch$ {type: 'anotherGif'}
      onClick: flyd.forwardTo(dispatch$, R.always({type: 'anotherGif'}))
      'Gimme More!'

module.exports = {init, update, view}