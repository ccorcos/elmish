// import Type from 'union-type'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import h     from 'react-hyperscript'

const loadingGif = require('tutorial/loading.gif')
const errorGif = require("tutorial/error.gif")

const randomUrl = (topic) =>
  `http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&&rating=pg&tag=${topic}`

 // init : () -> state
const init = (topic="explosions") => {
  return { topic: topic, url: loadingGif, count: 0, pending: true}
}

// update : (state, action) -> state
const update = curry((state, action) => {
  switch (action.type) {
    case 'newGif':
      return merge(state, {
        url: action.url,
        pending: false
      })
    case 'errorGif':
      console.warn("ERROR:", state, action)
      return merge(state, {
        url: errorGif,
        pending: false
      })
    case 'anotherGif':
      return merge(state, {
        url: loadingGif,
        count: state.count + 1,
        pending: true
      })
    default:
      return state
  }
})

let effects = curry((dispatch, state) => {
  return {
    html:
      h('div.giphy', [
        h('h2.topic', state.topic),
        h('img', {src: state.url}),
        h('button', {
          onClick: () => dispatch({type: 'anotherGif'})
        }, 'Gimme More!')
      ]),
    http: !state.pending ? [] :
      [{
        key: state.count,
        url: randomUrl(state.topic),
        method: 'get',
        onSuccess: (response) => {
          return dispatch({type: 'newGif', url: response.json.data.image_url})
        },
        onError: (response) => {
          return dispatch({type: 'errorGif', error: response})
        }
      }]
  }
})

export default {init, effects, update}
