// In this example, I'll demonstrate how to perform HTTP requests as declarative
// side-effects and also some webpack features that allow us to make very
// generalizable components.
//
// In this example, we'll fetch a random gif and display it. We'll also have
// a button to fetch another random gif.

import start from 'src/elmish'
import render from 'src/service/react'
import fetch from 'src/service/fetch'

import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import h     from 'react-hyperscript'

// Webpack has "loader" feature which allows you to require static assets within
// your Javascript so they're be bundled up at compile-time. This allows you
// to do all kinds of amazing things. For now, we'll use it to require a loading
// gif and an error gif.
const loadingGif = require('lib/loading.gif')
const errorGif = require("lib/error.gif")

// We'll also use stylus to import some styles specific to this component. This
// allows us to build really reusable components because their styles can be
// required from javascript. This is likely going to change the way you think
// about writing your Stylus/SCSS files because you're no longer assuming some
// global scope and importing all your files into one. The only files you should
// be importing in are files with parameter configurations and mixins that don't
// produce any compiled CSS, otherwise, you'll have lots of repetative CSS.
require('styles/giphy.styl')

// Using the giphy API
const randomUrl = (topic) =>
  `http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&&rating=pg&tag=${topic}`

// Each HTTP request needs a unique id and we'll use this function to generate
// unique random ids.
const randomId = () =>
  Math.round(Math.random()*Math.pow(10, 10)).toString()

const init = (topic="explosions") => {
  return {
    topic: topic,
    url: loadingGif,
    key: randomId(),
    pending: true
  }
}

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
        key: randomId(),
        pending: true
      })
    default:
      return state
  }
})

let declare = curry((dispatch, state) => {
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
        key: state.key,
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

// - declarative
// - very similar to react by bindgin actions to event hooks
// - we're using an es6 window.fetch polyfill service
// - the service works like this... url, key, rest...
// - if we havent gotten a response back, then we still need this data. thus
//   its very different from how redux works with the thunk and allows us to
//   do more powerful abstractions like graphql/relay and time travel.


const app = {init, declare, update}
start(app, [render, fetch])
