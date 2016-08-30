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

const configure = plugins => {

  const spec = plugins.reduce((acc, plugin) => ({
    lift: R.merge(acc.lift, plugin.lift || {}),
    middleware: R.merge(acc.middleware, plugin.middleware || {}),
    drivers: R.merge(acc.drivers, plugin.drivers || {}),
  }), {lift: {}, middleware:{}, drivers: {}})

  const lift = (path, obj) => {
    const lens = lensQuery(path)
    const viewState = (state) => R.view(lens)
    const liftDispatch = dispatch => partial(_liftDispatch)(dispatch, path)

    const lifted = R.map(
      fn => fn(path, viewState, liftDispatch)(obj),
      spec.lift,
    )

    return {
      // this may be useful for debugging later
      path: path.concat(obj.path),
      // set the state one
      _init: (state) => {
        return R.set(
          lens,
          // TODO think about init vs _init here later
          (obj.init && obj.init()) || obj._init(viewState(state)),
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
      ...lifted,
    }
  }

  const start = app => {

    const event$ = flyd.stream()

    const _dispatch = (action, payload, ...args) =>
      is.function(payload) ?
      event$({action, payload: payload(...args)}) :
      event$({action, payload})

    const dispatch = (action, payload) => partial(_dispatch)(action, payload)

    const state$ = flyd.scan(
      (state, {action, payload}) => app.update(state, action, payload),
      app.init(),
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
      R.values(drivers).forEach(driver => driver(app, dispatch)({state, ...middleware}))
    }, state$, middleware$)
  }

  return { start, lift }
}

const { start, lift } = configure([
  pubsub,
  react,
])

export { start, lift }
