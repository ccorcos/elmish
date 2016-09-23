// cleanup code
// solidify the pattern.
// - overridden effects should return a lazy tree
// - normal effects are the value in the lazy tree
// - if you only use overrides, you can build your own structure like with react
//   but you dont get the help of putting it all together for you under the hood
// - namespace will localize state, and mapDispatch for all the effects, init, update
//   etc. but you need to make sure to crawl the children keys to see all the
//   side-effects. children also MUST BE LIFTED. otherwise some quirks can happen
//   with namespace collisions and missing children effects when namespaceing.

// some potential issues
// - the effect thunk doesnt entirely work because a namespaceed child only cares
//   about its part of the state. so we'll need to figure that out later

// things to do next
// - clean up the hot keys driver
// - add batch update functionality with some way of merging dispatches.
// - build some other side effect drivers like http and giphy example
// - dynamic children example with listOf
// - lazy performance
// - pubsub

import R from 'ramda'
import node, { thunk, reduce } from 'lazy-tree'
import ReactDriver, { h } from 'elmish/v16/drivers/react'
import HotkeysDriver from 'elmish/v16/drivers/hotkeys'
import { shallow } from 'elmish/v16/utils/compare'
import configure, { namespace } from 'elmish/v16/elmish'

const start = configure([
  ReactDriver(document.getElementById('root')),
  HotkeysDriver,
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

start(twoOf(App2))
