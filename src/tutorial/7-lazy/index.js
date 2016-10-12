import ReactDOM from 'react-dom'
import React from 'react'
import R from 'ramda'

// referential equality
const eq = (a, b) => {
  if (a === b) {
    return true
  }
  if (a && a.equals && a.equals(b)) {
    return true
  }
  return false
}

// shallow object equality
const compare = (a, b) => {
  if (a === b) {
    return true
  }
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) {
    return false
  }
  for (var i = 0; i < ak.length; i++) {
    const k = ak[i]
    if (!eq(a[k], b[k])) {
      return false
    }
  }
  return true
}

// lazy react component
const Lazy = React.createClass({
  shouldComponentUpdate: function(next) {
    const props = this.props
    return !eq(props.state, next.state)
        || !eq(props.dispatch, next.dispatch)
        || !compare(props.pubs, next.pubs)
        || !compare(props.props, next.props)
  },
  render: function() {
    const {view, ...args} = this.props
    return view(args)
  }
})

// wrap the view function
const lazy = view => ({dispatch, state, pubs, props}) =>
  <Lazy view={view} dispatch={dispatch} state={state} pubs={pubs} props={props}/>

// remember a function's arguments for comparison
const partial = fn => (...args) => {
  const _fn = (...more) => fn(...args.concat(more))
  _fn.fn = fn
  _fn.args = args
  _fn.equals = b => b
                 && eq(b.fn, _fn.fn)
                 && R.equals(b.args, _fn.args)
  return _fn
}

// fixed arity of 2
const partial2 = fn => (a, b) => partial(fn)(a, b)

const configure = drivers => app => {
  const dispatch = partial2((type, payload, ...args) => {
    if (typeof payload === 'function') {
      update({type, payload: payload(...args)})
    } else {
      update({type, payload})
    }
  })
  let state = app.init()
  const listeners = drivers.map(d => d(app, dispatch))
  function update(action) {
    state = app.update(state, action)
    listeners.forEach(l => l(state))
  }
  listeners.forEach(l => l(state))
}

const mapPayload = partial((type, payload, ...args) => {
  return {
    type,
    payload: payload(...args),
  }
})

const forward = partial((dispatch, key, type, payload) => {
  if (typeof payload === 'function') {
    return dispatch(key, mapPayload(type, payload))
  } else {
    return dispatch(key, {type, payload})
  }
})

// const callback = partial((fn, payload, ...args) => {
//   if (typeof payload === 'function') {
//     return fn(payload(...args))
//   } else {
//     return fn(payload)
//   }
// })

const Counter = {
  init: () => 0,
  update: (state, action) => {
    if (action.type === 'inc') {
      return state + 1
    }
    if (action.type === 'dec') {
      return state - 1
    }
  },
  view: lazy(({dispatch, state}) => {
    console.log('render Counter')
    return (
      <div>
        <button onClick={dispatch('inc')}>{'-'}</button>
        <span>{state}</span>
        <button onClick={dispatch('inc')}>{'+'}</button>
      </div>
    )
  }),
}

const twoOf = kind => ({
  init: () => ({
    one: kind.init(),
    two: kind.init(),
  }),
  update: (state, action) => {
    if (action.type === 'one') {
      return {
        one: kind.update(state.one, action.payload),
        two: state.two,
      }
    }
    if (action.type === 'two') {
      return {
        one: state.one,
        two: kind.update(state.two, action.payload),
      }
    }
  },
  view: lazy(({dispatch, state}) => (
    <div>
      {kind.view({
        dispatch: forward(dispatch, 'one'),
        state: state.one,
      })}
      {kind.view({
        dispatch: forward(dispatch, 'two'),
        state: state.two,
      })}
    </div>
  )),
})

const ReactDriver = (app, dispatch) => {
  const root = document.getElementById('root')
  return state => {
    ReactDOM.render(app.view({dispatch, state}), root)
  }
}
const start =  configure([ReactDriver])

start(twoOf(Counter))
// start(twoOf(twoOf(Counter)))
