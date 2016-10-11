
import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import flyd from 'flyd'
// import is from 'is-js'

// Goals:
// - somehow wire up all the dispatch and state for you
// - some concept of global actions and state dependencies
//   - open or close the menu drawer
//   - get the user name
//   - "headless"/"stateful" components
// - declarative lazy data structures
//   - all data structures should work just like react, a lazy tree


// every declarative effect must return a lazy tree


const LazyReact = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    return !R.equals(this.props, nextProps) // || !R.equals(this.state, nextState)
  },
  render() {
    return R.apply(this.props.view, this.props.args)
  }
})

const viewbind = (view, ...args) => {
  return h(LazyReact, {view, args})
}

const lifters = {
  init: (obj) => () => R.map((c) => c.init(), obj),
  update: (obj) => route(R.map(c) => c.update, obj),
  render: (obj) => (d,s,p) => {
    return h('span.lift', R.map(name => {
      return viewbind(obj[name].render, forward(d, name), s[name], p[name] || p || {}),
    }, R.keys(obj)))
  },
  hotkeys: (obj) => (d,s,p) => {
    return R.map(name => {
      return bind(obj[name].hoykeys, forward(d, name), s[name], p[name] || p || {})
    }, R.keys(obj))
  },
}

const counter = {
  // init :: () -> state
  init: () => 0,
  // update :: state -> action -> state
  update: (s,a) => s+a,
  // effect :: dispatch -> state -> props -> tree
  render: (d,s,p) => {
    return h('div.counter', [
      h('button.dec', {onClick: bind(d, -p.step)}, '-'),
      h('span.count', s),
      h('button.inc', {onClick: bind(d, +p.step)}, '+'),
    ])
  },
  hotkeys: (d,s,p) => {
    return {
      '+': bind(d, +p.step),
      '-': bind(d, -p.step),
    }
  }
}




const app = {
  init: () => {
    return {
      count: counter.init(),
      step: counter.init(),
    }
  },
  update: route({
    count: counter.update,
    step: counter.update,
  }),
  render: (d,s,p) => {
    return h('div.app', [
      bind(counter.view, forward(d, 'step'), s.step, {step:1}),
      bind(counter.view, forward(d, 'count'), s.count, {step:s.step})
    ])
  }
}




const app = e.component({
  children: {
    count: counter,
    step: counter,
  }
})


























const counter = {
  init: () => 1,
  update: (state, action) => state + action,
  view: (dispatch, state) => {
    console.log('counter', state)
    const inc = bind(dispatch, +1)
    const dec = bind(dispatch, -1)
    return h('div.counter', [
      h('button.dec', {onClick:dec}, '-'),
      h('span.count', state),
      h('button.inc', {onClick:inc}, '+'),
    ])
  }
}



const propNeq = R.compose(R.complement, R.propEq)

const listOf = (kind) => {
  return {
    init: () => ({list: [], nextId: 0}),
    update: (state, action) => {
      switch (action.type) {
        case 'insert':
          const item = {
            id: state.nextId,
            state: kind.init()
          }
          return R.evolve({
            list: R.append(item),
            nextId: R.inc
          }, state)
        case 'remove':
          return R.evolve({
            list: R.filter(propNeq('id', action.id))
          }, state)
        case 'forward':
          const idx = R.findIndex(R.propEq('id', action.id), state.list)
          return R.evolve({
            list: R.adjust(R.evolve({
              state: (state) => kind.update(state, action.action)
            }), idx)
          }, state)
        default:
          console.warn("Unknown action:", action)
          return state
      }
    },
    view: (dispatch, state) => {
      const insert = bind(dispatch, {type: 'insert'})
      return h('div.list-of', [
        h('button.insert', {onClick: insert}, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              viewbind(kind.view, bind(forward, dispatch, item.id), item.state),
              h('button.remove', {onClick: bind(action, dispatch, 'remove', item.id)}, 'x')
            ])
          )
        })
      ])
    }
  }
}

const start = (app) => {
  const root = document.getElementById('root')
  const action$ = flyd.stream()
  const state$ = flyd.scan(app.update, app.init(), action$)
  const html$ = flyd.map(bind(app.view, action$), state$)
  const render = html => ReactDOM.render(html, root)
  flyd.on(render, html$)
}

start(listOf(counter))

// every side-effect / component needs to have some kind of algebraic structure
// that we can play with. for example, vdom has a .bind or just a constructor to
// put a value inside of it. they also have a concat to put them side by side.
// http requests have a concat to put them together which should also reduce
// any duplicates at the same time. hotkeys should concat with some degree of
// precedence. graphql has a .bind. idk if it should be called bind or compose.
// but the point is, we need to bake in these algebraic meanings so we can get
// better abstraction.











const Counter = {
  init: () => {
    return {
      count: 0,
    }
  },

}

const init = () => ({count: 0})

const update = curry((state, action) => {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1}
    case 'decrement':
      return {count: state.count - 1}
    default:
      console.warn("Unknown action:", action)
      return state
  }
})

const declare = curry((dispatch, state) => {
  const inc = () => dispatch({type: 'increment'})
  const dec = () => dispatch({type: 'decrement'})
  return {
    html:
      h('div.counter', [
        h('button.dec', {onClick: dec}, '-'),
        h('span.count', {}, state.count),
        h('button.inc', {onClick: inc}, '+')
      ])
  }
})

export default {init, update, declare}
