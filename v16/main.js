
// bonus things to work on
// - redux middleware / enhancer api
// - visualize lazy evaluation tree
// - refactor, function names, comments, documentation, readme, tutorial

// things to do next
// - compute the entire component tree once for each state. do this lazily based
//   on the state of each compoont child. then when we have a nonlazy component tree.
//   reduce the component tree to get the global publication object
//   then how do we get a component's subscriptions with all its children subscriptions
//   lazily? I suppose we can create a publication object that targets each child's
//   subscriptions and use the state lens to create said object.
// map over the tree
//   to create a lazy tree that computes an the effects which are then lazily
//   reduced.

// - computeEffects now depends on state. lets try to compute children lazily
//   and compute the component tree only once, and share that with all the
//   effects drivers
// - pubsub driverso that we can lazily compute this but i dont know how we'd
//   pass it down...

import R from 'ramda'
import ReactDriver, { h } from 'elmish/v16/drivers/react'
import HotkeysDriver from 'elmish/v16/drivers/hotkeys'
import HTTPDriver from 'elmish/v16/drivers/http'
import { shallow } from 'elmish/v16/utils/compare'
import configure, { nest, nestWith, computeInit, computeUpdate } from 'elmish/v16/elmish'
import createLogger from 'redux-logger'

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
      if (type === 'inc') {
        return {
          ...state,
          count: state.count + 1,
        }
      }
      if (type === 'dec') {
        return {
          ...state,
          count: state.count - 1,
        }
      }
      return state
    },
  },
  effects: {
    _react: ({dispatch, state, props}) => {
      console.log('counter react')
      return h('div.counter', {}, [
        h('button.dec', {onClick: dispatch('dec')}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: dispatch('inc')}, '+'),
      ])
    },
    hotkeys: ({dispatch, state, props}) => {
      console.log('counter hotkeys')
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
      if (type === 'username/change') {
        return {
          ...state,
          username: payload,
        }
      }
      return state
    },
  },
  effects: {
    _react: ({dispatch, state, props}) => {
      return h('input.username', {
        value: state.username,
        onChange: dispatch('username/change', targetValue)
      })
    },
  },
}

// start(Counter)
// start(Username)

const App = {
  children: [Counter, Username],
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.app', {}, [
        h(Counter, {dispatch, state}),
        h(Username, {dispatch, state}),
      ])
    },
  },
}

// start(App)

const Counter1 = nest('counter', Counter)
const Username1 = nest('username', Username)

const App2 = {
  children: [Counter1, Username1],
  effects: {
    _react: ({dispatch, state}) => {
      return h('div.app', {}, [
        h(Counter1, {dispatch, state}),
        h(Username1, {dispatch, state}),
      ])
    },
  },
}

// start(App2)

const twoOf = app => {
  const app1 = nest('version1', app)
  const app2 = nest('version2', app)
  return {
    children: [app1, app2],
    effects: {
      _react: ({dispatch, state}) => {
        return h('div.two-of', {}, [
          h(app1, {dispatch, state}),
          h(app2, {dispatch, state}),
        ])
      },
    },
  }
}

// start(twoOf(App2))
// start(twoOf(twoOf(App2)))

const randomUrl = (topic) =>
  `http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&&rating=pg&tag=${topic}`

const imgSrc = response => response.json.data.image_url

// take a seed so we dont dedupe http requests
const Giphy = seed => {
  return {
    state: {
      init: {
        topic: 'explosions',
        img: undefined,
        pending: true,
        error: false,
        id: seed,
      },
      update: (state, {type, payload}) => {
        switch(type) {
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
      _react: ({dispatch, state}) => {
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
}

// start(Giphy(0))
// start(twoOf(Giphy(0)))

const Giphy1 = nest('giphy1', Giphy(0))
const Giphy2 = nest('giphy2', Giphy(100))
const Giphy3 = nest('giphy3', Giphy(200))
const ThreeGiphy = {
  children: [Giphy1, Giphy2, Giphy3],
  effects: {
    _react: (p) => {
      return h('div', {}, [
        h(Giphy1, p),
        h(Giphy2, p),
        h(Giphy3, p),
      ])
    }
  }
}

// start(ThreeGiphy)

const nestUndoable = nestWith({
  action: { type: 'app' },
  getState: state => state.states[state.time],
  // we're overriding _init and _update anyways so this doesnt matter
  setState: (substate, state) => substate
})

const undoable = (app) => {
  const undoableApp = nestUndoable(app)
  return {
    children: [undoableApp],
    state: {
      _init: {
        time: 0,
        states: [computeInit(app)]
      },
      _update: (state, {type, payload}) => {
        if (type === 'app') {
          const present = state.states[state.time]
          const next = computeUpdate(app)(present, payload)
          return {
            time: state.time + 1,
            states: state.states.slice(0, state.time + 1).concat([next])
          }
        }
        if (type === 'undo') {
          return {
            ...state,
            time: state.time - 1,
          }
        }
        if (type === 'redo') {
          return {
            ...state,
            time: state.time + 1,
          }
        }
        return state
      },
    },
    effects: {
      _react: ({dispatch, state, props}) => {
        const canUndo = state.time > 0
        const canRedo = state.time < state.states.length - 1
        return h('div.undoable', {}, [
          h('button.undo', {
            disabled: !canUndo,
            onClick: canUndo ? dispatch('undo') : undefined
          }, 'undo'),
          h('button.redo', {
            disabled: !canRedo,
            onClick: canRedo ? dispatch('redo') : undefined
          }, 'redo'),
          h(undoableApp, {dispatch, state, props})
        ])
      },
      hotkeys: ({dispatch, state, props}) => {
        const canUndo = state.time > 0
        const canRedo = state.time < state.states.length - 1
        return {
          'cmd z': canUndo ? dispatch('undo') : () => {},
          'cmd shift z': canRedo ? dispatch('redo') : () => {},
        }
      }
    }
  }
}

// start(undoable(App2))
// start(undoable(twoOf(App2)))

const nestListOf = (id, app) =>
  nestWith({
    action: { type: 'item', id },
    getState: state => state.items.find(item => item.id === id).state,
    setState: (substate, state) => substate,
  })(app)

const listOf = app => {
  return {
    children: state => {
      return state.items.map(item => nestListOf(item.id, app))
    },
    state: {
      _init: {
        id: 1,
        items: [{
          id: 0,
          state: computeInit(app)
        }]
      },
      _update: (state, {type, payload, id}) => {
        if (type === 'item') {
          const item = state.items.find(item => item.id === id)
          const next = computeUpdate(app)(item.state, payload)
          return {
            ...state,
            items: state.items.map(item => {
              if (item.id === id) {
                return {
                  ...item,
                  state: next,
                }
              }
              return item
            })
          }
        }
        if (type === 'insert') {
          return {
            ...state,
            id: state.id + 1,
            items: state.items.concat([{
              id: state.id,
              state: computeInit(app)
            }])
          }
        }
        if (type === 'remove') {
          return {
            ...state,
            items: state.items.filter(item => {
              return item.id !== payload
            })
          }
        }
        return state
      },
    },
    effects: {
      _react: ({dispatch, state, props}) => {
        return h('div.list-of', {}, [
          h('button', {
            onClick: dispatch('insert'),
          }, 'insert'),
          state.items.map(item => {
            return h('div.item', {key: item.id}, [
              h(nestListOf(item.id, app), {state, dispatch, props}),
              h('button', {
                onClick: dispatch('remove', item.id),
              }, 'remove')
            ])
          })
        ])
      }
    }
  }
}

start(listOf(App2))
// start(listOf(listOf(App2)))

const logger = createLogger()

const withLogger = app => {
  return {
    children: [app],
    state: {
      _update: (state, action) => {
        const store = {
          getState: () => state,
        }
        const nextState = computeUpdate(app)(state, action)
        logger(store)(() => nextState)(action)
        return nextState
      }
    },
    effects: {
      _react: app.effects._react,
    }
  }
}

// start(withLogger(listOf(App2)))
