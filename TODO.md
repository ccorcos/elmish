## To Do (Fun)

- physics animations
- assortment of sliders, durations, and easing functions

- publish examples on github _pages with automated script

- CSS in JS https://speakerdeck.com/vjeux/react-css-in-js

- ui components (with routing examples!)
  - responsive splitvc -- http://nshipster.com/uisplitviewcontroller/
  - navvc
  - tabvc

- json-diff-patch stateless chatroom example
- meteor service

## To Do (Not Fun)

- http caching
- graphql caching
- performance and memoization
- latency compensation
- auth service?
- immutable with functionize
- send errors on exceptions
- record, save, replay
- generative testing
- predictive testing

## Extras

- demo apps
  - chatroom
  - localized chat
  - tinder
  - uber
  - instagram
  - reddit


## Notes

React has a basic JSON declarative tree:

{
  type: 'div',
  props: {
    className: 'user-item'
    onClick: (e) => this.setState({selected: user.id})
  }
  children: [{
    type: 'span'
    props: {}
    children: [user.id]
  }]
}

When we build our user interface, we're just patching these trees together.

GraphQL has a basic declarative JSON tree as well:

{
  fields: {
    followers: {
      params: {
        userId: user.id
      },
      fields: {
        name: {},
        posts: {
          params: {
            limit: 20
          },
          fields: {
            count: {},
          }
        }
      }
    }
  }
}



# HMR

// check if HMR is enabled
if (module.hot) {
  // accept update of dependency
  module.hot.accept(["src/giphy", "src/debug"], () => {
    // save the previous state of the application
    const state = state$()
    // stop all side-effects
    handler.end(true)
    // import the latest versions
    let app = require('src/giphy').default
    let debug = require('src/debug').default
    // override init
    const {effects, update} = debug(app)
    const init = () => state
    // mutate and restart side-effects
    const result = start({init, effects, update})
    effect$ = result.effect$
    state$ = result.state$
    handler = flyd.map(({html, http}) => {
      render(html)
      fetch(http)
    }, effect$)
  });
}


# Boilerplate

import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'

const init = () => {
  return { }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'something': 
      return merge(state, {

      })
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {

  return {
    html:
      h('div.app')
  }
})

export default {init, declare, update}

// https://github.com/KyleAMathews/typography.js

// embrace the log. great talk.
// https://www.youtube.com/watch?v=EOz4D_714R8

// how does this work with data and caching etc? embrace the log.
// log everything and the reducers just maintain intermediary state.
// remember what he said about how kafka works. we can run through 
// the logs and incrementally reduce them while also trimming the logs
// so we only keep what matters.