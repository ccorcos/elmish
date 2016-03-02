import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import flyd from 'flyd'

const ƒ = (fn, ...args) => {
  let _fn = (...more) => {
    return R.apply(fn, R.concat(args, more))
  }
  _fn.fn = fn
  _fn.args = args
  _fn.equals = (fn2) => {
    return R.equals(fn2.fn, _fn.fn) &&
           R.equals(fn2.args, _fn.args)
  }
  return _fn
}

const LazyReact = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    return !R.equals(this.props, nextProps) ||
           !R.equals(this.state, nextState)
  },
  render() {
    return R.apply(this.props.view, this.props.args)
  }
})

const viewƒ = (view, ...args) => {
  return h(LazyReact, {view, args})
}

const counter = {
  init: () => 1,
  update: (state, action) => state + action,
  view: (dispatch, state) => {
    console.log('counter', state)
    const inc = ƒ(dispatch, +1)
    const dec = ƒ(dispatch, -1)
    return h('div.counter', [
      h('button.dec', {onClick:dec}, '-'),
      h('span.count', state),
      h('button.inc', {onClick:inc}, '+'),
    ])
  }
}

const forward = (dispatch, id, action) => {
  dispatch({type: 'forward', id, action})
}
const action = (dispatch, type, id) => {
  dispatch({type, id})
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
      const insert = ƒ(dispatch, {type: 'insert'})
      return h('div.list-of', [
        h('button.insert', {onClick: insert}, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              viewƒ(kind.view, ƒ(forward, dispatch, item.id), item.state),
              h('button.remove', {onClick: ƒ(action, dispatch, 'remove', item.id)}, 'x')
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
  const html$ = flyd.map(ƒ(app.view, action$), state$)
  const render = html => ReactDOM.render(html, root)
  flyd.on(render, html$)
}

start(listOf(counter))

