// In this example, I'll demonstrate how to perform HTTP requests as declarative
// side-effects and also some webpack features that allow us to make very
// generalizable components.
//
// In this example, we'll fetch a random gif and display it. We'll also have
// a button to fetch another random gif.

import start from 'elmish'
import render from 'elmish/services/react'
import fetch from 'elmish/services/fetch'
import hotkeys from 'elmish/services/hotkeys'
import debug from 'elmish/ui/debug'

import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import h     from 'react-hyperscript'

// Webpack has "loader" feature which allows you to require static assets within
// your Javascript so they're be bundled up at compile-time. This allows you
// to do all kinds of amazing things. For now, we'll use it to require a loading
// gif and an error gif.
const loadingGif = require('elmish/tutorial/7/loading.gif')
const errorGif = require("elmish/tutorial/7/error.gif")

// We'll also use stylus to import some styles specific to this component. This
// allows us to build really reusable components because their styles can be
// required from javascript. This is likely going to change the way you think
// about writing your Stylus/SCSS files because you're no longer assuming some
// global scope and importing all your files into one. The only files you should
// be importing in are files with parameter configurations and mixins that don't
// produce any compiled CSS, otherwise, you'll have lots of repetative CSS.
require('elmish/tutorial/7/giphy.styl')

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

const app = {init, declare, update}

// A few things to notice here:
// Rather than return a Promise or a Future or some other side-effect, we're
// return a declarative data structure that says what we want. Not that if
// other user interface actions were going one while the the HTTP request is
// in flight, we still return an object saying, "hey, I still need this.".
//
// Just like React does virtual DOM diffing to do the minimum amount of DOM
// mutation, the fetch service diffs the requests with any requests that are
// currently in-flight so we're not sending multiple requests when we don't
// need to. We perform this diff based on the key property of the http request
// object.
//
// The fetch service is based on the ES6 window.fetch API. The url property
// becomes the first argument to window.fetch and all other properties other
// than key, onSuccess, and onError are passed as the second argument to
// window.fetch.
//
// https://github.com/github/fetch
//
// Anyways, try it out:

// start(app, [render, fetch])

// The power we gain from declaratively data fetching is the same as we gained
// from using a virtual DOM like React. We no longer have to worry about all
// the imperative side-effects going on and gain more control over our
// application.
//
// One particlarly powerful demonstration of this is time-travel. When you're
// application spawns side-effects from within the lifecycle of the component
// you end up spamming your external services when you do time-travel (like
// with Redux and the thunk middleware) and if you block those side-effects,
// then you cannot gracefully recover when you press play from the state of a
// pending request.
//
// Check out this example with the time-travelling debugger. Use `ctrl d` to
// toggle the debug panel. And try pressing play from a state where the request
// is pending. Now hopefully you can really appreciate the abstraction power
// we have harnessed by diligently writing pure, side-effect free code. :)

start(debug(app), [render, fetch, hotkeys])

// A couple things to note about using the debugger with this example:
// - Chrome will not cache the images if you have the Dev Tools open, so the
// images will have to reload as you slide. But close the Dev Tools and it
// will work more like you expect.
// - Giphy will return a random gif every time you send a request, so when you
// press play from a pending state, you'll likely get a different gif from
// before. Another way to say this is the random giphy API is not idempotent.
