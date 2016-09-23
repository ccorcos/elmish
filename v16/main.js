
// some potential issues
// - the effect thunk doesnt entirely work because a namespaceed child only cares
//   about its part of the state. so we'll need to figure that out later

// things to do next
// - use generic graph structure for react and translate in the react driver
// - now batch dispatch should be a lot easier
// - how could we redefine all of this to use flowtype?
//   - lets use phantom types to define a dispatch thunk
// - batch dispatch
//   - dispatch functions keep track of their arguments and we can leverage that
//     to return a function that dispatches multiple actions.
//   - batch properly in http and hotkeys when reducing
// - dynamic children example with listOf
// - lazy performance
// - pubsub

// - any way for react driver to be translated from the node tree?
// - how can we get lazy performance from namespacing?

import R from 'ramda'
import ReactDriver, { h } from 'elmish/v16/drivers/react'
import HotkeysDriver from 'elmish/v16/drivers/hotkeys'
import HTTPDriver from 'elmish/v16/drivers/http'
import { shallow } from 'elmish/v16/utils/compare'
import configure, { namespace } from 'elmish/v16/elmish'

const start = configure([
  ReactDriver(document.getElementById('root')),
  HotkeysDriver,
  HTTPDriver,
])

const Counter = {
  state: {
    init: {
      count : 0,
    },
    update: (state, {type, payload}) => {
      if (type[0] === 'inc') {
        return { count: state.count + 1 }
      }
      if (type[0] === 'dec') {
        return { count: state.count - 1 }
      }
      return state
    },
  },
  effects: {
    _view: ({dispatch, state, props}) => {
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
    hotkeys: ({dispatch, state, props}) => {
      return {
        '=': dispatch('inc'),
        '-': dispatch('dec'),
      }
    },
  },
}

const targetValue = e => e.target.value

const Username = {
  state: {
    init: {
      username: '',
    },
    update: (state, {type, payload}) => {
      if (type[0] === 'username/change') {
        return {
          username: payload,
        }
      }
      return state
    },
  },
  effects: {
    _view: ({dispatch, state, props}) => {
      return h('input.username', {
        value: state.username,
        onChange: dispatch('username/change', targetValue)
      })
    },
  },
}

// start(Counter)
// start(Username)

const Counter1 = namespace('counter', Counter)
const Username1 = namespace('username', Username)

const App2 = {
  children: [Counter1, Username1],
  effects: {
    _view: ({dispatch, state}) => {
      return h('div.app', {}, [
        h(Counter1, {dispatch, state}),
        h(Username1, {dispatch, state}),
      ])
    },
  },
}

// start(App2)

const twoOf = app => {
  const app1 = namespace('version1', app)
  const app2 = namespace('version2', app)
  return {
    children: [app1, app2],
    effects: {
      _view: ({dispatch, state}) => {
        return h('div.two-of', {}, [
          h(app1, {dispatch, state}),
          h(app2, {dispatch, state}),
        ])
      },
    },
  }
}

// start(twoOf(App2))

const randomUrl = (topic) =>
  `http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&&rating=pg&tag=${topic}`

const imgSrc = response => response.json.data.image_url

const Giphy = {
  state: {
    init: {
      topic: 'explosions',
      img: undefined,
      pending: true,
      error: false,
      id: 0,
    },
    update: (state, {type, payload}) => {
      switch(type[0]) {
        case 'newGif':
          return {
            ...state,
            img: payload,
            pending: false,
            error: false,
          }
        case 'errorGif':
          return {
            ...state,
            img: undefined,
            pending: false,
            error: true,
          }
        case 'anotherGif':
          return {
            ...state,
            img: undefined,
            pending: true,
            id: state.id + 1,
          }
        default:
          return state
      }
    }
  },
  effects: {
    _view: ({dispatch, state}) => {
      return h('div.giphy', {}, [
        h('h2.topic', {}, state.topic),
        state.error ? 'ERROR' : state.pending ? 'LOADING' : h('img', {src: state.img}),
        h('button', {
          onClick: dispatch('anotherGif'),
        }, 'Gimme More!')
      ])
    },
    http: ({dispatch, state}) => {
      if (state.pending) {
        return {
          [state.id]: {
            url: randomUrl(state.topic),
            method: 'get',
            onSuccess: dispatch('newGif', imgSrc),
            onFailure: dispatch('errorGif'),
          },
        }
      }
      return {}
    },
  },
}

// start(Giphy)
start(twoOf(Giphy))
