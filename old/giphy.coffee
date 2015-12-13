{html, R, flyd} = require './elmish'

randomUrl = (topic) -> 
  "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=#{topic}"

# side-effects return a promise of an action
getRandomGif = (topic) ->
  fetch(randomUrl(topic))
    .then (response) ->
      response.json()
    .then ({data}) ->
      type: 'newGif'
      url: data?.image_url
    .catch (error) ->
      type: 'errorGif'
      error: error

# init : (effect$) -> model
init = (effect$, topic="cats") -> 
  effect$(getRandomGif(topic))
  topic:topic, url: require('tutorial/loading.gif')

# update : (effect$, model, action) -> model
update = (effect$, model, action) ->
  switch action.type
    when 'newGif' then return R.assoc('url', action.url, model)
    when 'errorGif' then return R.assoc('url', require("tutorial/error.gif"), model)
    when 'anotherGif'
      effect$(getRandomGif(model.topic))
      return R.assoc('url', require('tutorial/loading.gif'), model)
    else return model

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