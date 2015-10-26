# window.fetch polyfill
require 'whatwg-fetch'
R = require 'ramda'
{html} = require './elmish'

randomUrl = (topic) -> "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=#{topic}"
getRandomGif = (topic) ->
  fetch randomUrl(topic)
    .then (response) ->
      response.json()
    .then ({data}) ->
      type: 'newGif'
      url: data?.image_url

init = (topic="funny cats") -> 
  state: {topic, url: 'v1/loading.gif'}
  effects: getRandomGif(topic)

update = (action, state) ->
  switch action.type
    when 'newGif' then return {state: R.assoc('url', action.url, state)}
    when 'anotherGif' then return {state: R.assoc('url', 'v1/loading.gif', state), effects: getRandomGif(state.topic)}
    else return {state}

view = (dispatch, state) ->
  html.div {},
    html.h2 {}, state.topic
    html.img
      src: state.url
    html.button
      onClick: -> dispatch {type: 'anotherGif'}
      'Gimme More!'

module.exports = {init, update, view}