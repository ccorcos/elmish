// next time:
// grab hotkeys from v13+, _hotkeys should return a lazy-tree and hotkeys should
// return an object. then in the driver we can lazily reduce over the tree.
// we'll need to figure out how to deal with react in a more generic way. using
// _view is definitely a sound requirement. using the custom h helper is
// reasonable as well. but being able to generically lift side-effects is nice.
// we cant do without lifting these fuctions because mapDispatch, etc...
// i think it makes sense to favor a single format for lazy-tree for all side-effects
// so maybe we could have a less hacky way to get react to comply...

// lets add batches action funtionality for the sake of hotkeys. we could do this
// by ensuring everything in the `action$` is an array of actions. but we also
// want to be able to batch the functions that dispatch actions. for example, what
// if we want to call two callback hooks at the same time that both dispatch actions?

// lets refactor the api to make things pretty agnostic of the exact layout
// or formatting, basically just setters and getters for effects... and what not
 // lets also see if we can add flowtype before going much further


// - polish up
// - generic side-effects
// - dynamic children?
// - lazy performance
// - batch actions
// - pubsub

import R from 'ramda'
import flyd from 'flyd'
import is from 'elmish/v13+/utils/is'
import { thunk, node } from 'lazy-tree'
import ReactDriver, { h } from 'elmish/v16/drivers/react'

// crawls children and merges all initial states
const computeInit = app => {
  if (app.state && app.state._init) {
    return app.state._init
  }
  return (app.children || []).reduce(
    (st, child) => ({...st, ...computeInit(child)}),
    app.state && app.state.init || {},
  )
}

// crawls children and computes the update method that routes actions
// through all of the of the children update functions.
// NOTE: if you're component's update function does not return the keys
// it does not mutate, then you'll only see the state return by the last
// child's update because we've merged the children states in `computeInit`
const computeUpdate = app => {
  if (app.state && app.state._update) {
    return app.state._update
  }
  return (state, action) => {
    return (app.children || []).reduce(
      (st, child) => computeUpdate(child)(st, action),
      (app.state && app.state.update) ? app.state.update(state, action) : state,
    )
  }
}


const partial = thunk(R.equals)
const partial2 = thunk((a,b) => a === b)

const wrapActionType = type =>
  is.array(type) ? type : [type]

const configure = drivers => app => {
  const action$ = flyd.stream()
  const state$ = flyd.scan(
    (state, action) => {
      console.log("scan", state, action)
      return computeUpdate(app)(state, action)
    },
    computeInit(app),
    action$
  )

  const _dispatch = (type, payload, ...args) =>
    is.function(payload) ?
    action$({type: wrapActionType(type), payload: payload(...args)}) :
    action$({type: wrapActionType(type), payload})

  const dispatch = partial(_dispatch)

  flyd.on(state => {
    drivers.forEach(driver => driver(app, dispatch)(state))
  }, state$)
}

const start = configure([
  ReactDriver(document.getElementById('root'))
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

// now the question is how do we handle children and overriding now
// lifting comes later ;)

const App = {
  children: [Counter, Username],
  effects: {
    _view: ({dispatch, state}) => {
      return h('div.app', {}, [
        h(Counter, {dispatch, state}),
        h(Username, {dispatch, state}),
      ])
    },
  },
}

// this currently only works if we merge the states returned from the update
// methods, so for now, lets try to figure out how lift works.
// start(App)

const _mapDispatch = (key, dispatch, type, payload) => {
  return dispatch([key, is.array(type) ? type : [type]], payload)
}

const mapDispatch = partial(_mapDispatch)

const lift = (key, app) => {
  return {
    state: {
      _init: {
        [key]: computeInit(app),
      },
      _update: (state, {type, payload}) => {
        if (type[0] === key) {
          return {
            ...state,
            [key]: computeUpdate(app)(state[key], {type: type[1], payload})
          }
        }
        return state
      },
    },
    effects: Object.keys(app.effects || {}).map(name => {
      if (name[0] === '_') {
        return {
          [name]: ({dispatch, state, props}) => {
            return app.effects[name]({
              dispatch: mapDispatch(key, dispatch),
              state: state[key],
              props,
            })
          },
        }
      }
      // TODO this should return a lazy tree!
      return {
        [name]: ({dispatch, state, props}) => {
          return app.effects[name]({
            dispatch: mapDispatch(key, dispatch),
            state: state[key],
            props,
          })
        },
      }
    }).reduce(R.merge)
  }
}

const Counter1 = lift('counter', Counter)
const Username1 = lift('username', Username)

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
  const app1 = lift('version1', app)
  const app2 = lift('version2', app)
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

start(twoOf(App2))
