{html, R, flyd, bind, Req} = require './elmish'

requestRandomGif = (topic) ->
  Req.request
    service: 'http'
    resource: {url: "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=#{topic}"}, 
    onSuccess: {type: 'newGif', result: Req.__}
    onError: {type: 'errorGif', error: Req.__}

# init : () -> {state, requests}
init = (topic="cats") -> 
  state: {topic:topic, url: require('tutorial/loading.gif')}
  requests: [requestRandomGif(topic)]

# update : (state, action) -> {state, requests}
update = (state, action) ->
  switch action.type
    when 'newGif'
      state: R.assoc('url', action.result.data.image_url, state)
      requests: []
    when 'errorGif' 
      state: R.assoc('url', require("tutorial/error.gif"), state)
      requests: []
    when 'anotherGif'
      state: R.assoc('url', require('tutorial/loading.gif'), state)
      requests: [requestRandomGif(state.topic)]
    else
      state: state
      requests: []

# view : (dispatch, model) -> html
view = (dispatch, model) ->
  html.div {},
    html.h2 {}, model.topic
    html.img
      src: model.url
    html.button
      onClick: bind([{type: 'anotherGif'}], dispatch)
      'Gimme More!'

module.exports = {init, update, view}