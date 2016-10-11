import R from 'ramda'
import flyd from 'flyd'
import React from 'react'
import ReactDOM from 'react-dom'
import { thunk } from 'lazy-tree'
import flydLift from 'flyd/module/lift'
import hotkeys from 'elmish/v12/hotkeys'
import is from 'elmish/v13+/utils/is'
import { lensIdentity, lensWhereEq } from 'elmish/v13+/utils/lens'
import pubsub from 'elmish/v13+/plugins/pubsub'
import react from 'elmish/v13+/plugins/react'

const liftAction = (path, action) => [path, action]

const unliftAction = (action) => action[1]

export const isLiftedAction = (path, action) =>
  is.array(action) && R.equals(action[0], path)

export const lensQuery = (path) => {
  if (is.string(path)) {
    return R.lensProp(path)
  } else if (is.number(path)) {
    return R.lensIndex(path)
  } else if (is.object(path)) {
    return lensWhereEq(path)
  } else if (is.array(path)) {
    return R.reduce(
      (l, p) => R.compose(l, lensQuery(p)),
      lensIdentity,
      path
    )
  }
}

const partial = thunk(R.equals)

const _liftDispatch = (dispatch, path, action, payload) => dispatch(liftAction(path, action), payload)

const reduce = (name, sibling, parent, tree) => {
  const override = `_${name}`
  if (tree[override]) {
    return tree[override]
  }
  if (tree[name]) {
    if (tree.children) {
      return parent(
        tree[name],
        tree.children.map(child => reduce(name, sibling, parent, child)).reduce(sibling)
      )
    }
    return tree[name]
  }
  if (tree.children) {
    return tree.children.map(child => reduce(name, sibling, parent, child)).reduce(sibling)
  }
}

// this is more of a breadth first traversal as opposed to reduce which is depth first
// the difference being that we're carrying the result, not just mapping over the function
export const construct = (tree, state) => {
  const name = 'init'
  const override = `_${name}`
  if (tree[override]) {
    return tree[override](state)
  }
  if (tree[name]) {
    const st = tree[name](state)
    if (tree.children) {
      return tree.children.reduce((s, child) => construct(child, s), st)
    }
    return st
  }
  if (tree.children) {
    return tree.children.reduce((s, child) => construct(child, s), state)
  }
  return state
}

const configure = plugins => {

  const spec = plugins.reduce((acc, plugin) => ({
    lift: R.merge(acc.lift, plugin.lift || {}),
    middleware: R.merge(acc.middleware, plugin.middleware || {}),
    drivers: R.merge(acc.drivers, plugin.drivers || {}),
  }), {lift: {}, middleware:{}, drivers: {}})

  const lift = (path, obj) => {
    const lens = lensQuery(path)
    const viewState = R.view(lens)
    const liftDispatch = dispatch => partial(_liftDispatch)(dispatch, path)

    const baseLift = {
      children: (obj.children || []).map(child => lift(path, child)),
      _init: (state) => {
        return R.set(
          lens,
          obj._init(viewState(state)),
          state
        )
      },
      // check if the action should be routed to this component, unlift it, and
      // pass it on.
      update: (state, action, payload) => {
        if (isLiftedAction(path, action)) {
          return R.over(
            lens,
            s => obj.update(s, unliftAction(action), payload),
            state
          )
        } else {
          return state
        }
      },
      _update: (state, action, payload) => {
        if (isLiftedAction(path, action)) {
          return R.over(
            lens,
            s => obj.update(s, unliftAction(action), payload),
            state
          )
        } else {
          return state
        }
      },
    }

    const pluginLift = R.map(fn => fn(path, viewState, liftDispatch)(obj), spec.lift)

    // all component needs to have an init function so they can construct all
    // of the intermediate states for their children to write to. every component
    // state must be an object
    const init = obj._init ? {} : {
      init: (state) => {
        return R.set(
          lens,
          (obj.init && obj.init(viewState(state))) || {},
          state
        )
      },
    }
    return {
      // this may be useful for debugging later
      path: path.concat(obj.path || []),
      ...init,
      ...R.pick(R.keys(obj), R.merge(baseLift, pluginLift)),
    }
  }

  const start = app => {

    const event$ = flyd.stream()

    const _dispatch = (action, payload, ...args) =>
      is.function(payload) ?
      event$({action, payload: payload(...args)}) :
      event$({action, payload})

    const dispatch = (action, payload) => partial(_dispatch)(action, payload)

    // const init = reduce(
    //   'init',
    //   (i1, i2) => (s) => R.merge(i1(s), i2(s)),
    //   (i1, i2) => (s) => R.merge(i1(s), i2(s)),
    //   app
    // )

    const update = reduce(
      'update',
      (u1, u2) => (s, a, p) => u1(u2(s, a, p), a, p),
      (u1, u2) => (s, a, p) => u1(u2(s, a, p), a, p),
      app
    )

    const state$ = flyd.scan(
      (state, {action, payload}) => update(state, action, payload),
      construct(app, {}),
      event$
    )

    const middleware$ = flyd.map(state =>
      R.map(
        fn => fn(app, dispatch)(state),
        spec.middleware
      ),
      state$
    )

    flydLift((state, middleware) => {
      R.values(spec.drivers).forEach(driver => driver(app, dispatch)({state, ...middleware}))
    }, state$, middleware$)
  }

  return { start, lift }
}

const root = document.getElementById('root')

const { start, lift } = configure([
  pubsub,
  react(root),
])

export { start, lift }
