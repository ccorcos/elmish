{html} = require './elmish'

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

assoc = (key, value, obj) ->
  prop = {}
  prop[key] = value
  Object.assign({}, obj, prop)

# init : () -> {model, effect}
init = (topic="funny cats") -> 
  model: {topic, url: 'loading.gif'}
  effects: [getRandomGif(topic)]

# update : (action, model) -> {model, effects}
update = (action, model) ->
  switch action.type
    when 'newGif' then return {model: assoc('url', action.url, model)}
    when 'errorGif' then return {model: assoc('url', "error.gif", model)}
    when 'anotherGif' then return {model: assoc('url', 'loading.gif', model), effects: [getRandomGif(model.topic)]}
    else return {model}

# view : (dispatch, model) -> html
view = (dispatch, model) ->
  html.div {},
    html.h2 {}, model.topic
    html.img
      src: model.url
    html.button
      onClick: -> dispatch {type: 'anotherGif'}
      'Gimme More!'

module.exports = {init, update, view}