## To Do (Fun)

- ui layout
- responsive ui
- ui animation

- tabnav app
  - routing and view controllers
  - github api with login and oauth
  - tabs
    - search users
    - search repos
    - profile
  - pages
    - repo page
      - name, owner, stargazers
    - user page
      - name, repos, following, followers
  - http caching

- simple chatroom example
  - responsive splitview
  - list of rooms
    - in memory db for now is fine
    - use aws dynamo later
  - users
    - use localStorage service to save user's name for now
    - user passport for user auth later
  - queries
    - simple chatrooms for now
    - complicated reactive aggregation queries possibly with graphql later
      - room owner
      - room info / stats
      - user info / stats
      - tabnav with friends, groups, etc.
  - websockets
  - latency compensation

- ui components (with routing examples!)
  - responsive splitvc -- http://nshipster.com/uisplitviewcontroller/
  - navvc
  - tabvc

- json-diff-patch stateless chatroom example
- meteor service

- performance and memoization
  - pass a function with a context to lazily evaluate child functions in the tree

## To Do (Not Fun)

- http caching
- graphql caching
- latency compensation
- auth service?
- send errors on exceptions
- record, save, replay
- generative testing
- predictive testing

- physics animations
  - gravitas.js
  - hammer.js
  - slalom.js
  - assortment of sliders, durations, and easing functions

- cassoway constrain solver for layout in js
  - make a UI for building UI's
  - slalom.js
  - autolayout.js
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia

- publish examples on github _pages with automated script

- CSS in JS https://speakerdeck.com/vjeux/react-css-in-js
  - body styles
  - before and after styles

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