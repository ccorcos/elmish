import R from 'ramda'
import flyd from 'flyd'
import React from 'react'
import ReactDOM from 'react-dom'
import { partial } from 'elmish/v10/z'
import flydLift from 'flyd/module/lift'
import hotkeys from 'elmish/v12/hotkeys'


export const lensQuery = (path) => {
  if (isString(path)) {
    return R.lensProp(path)
    } else if (isNumber(path)) {
    return R.lensIndex(path)
  } else if (isObject(path)) {
    return lensWhereEq(path)
  } else if (isArray(path)) {
    return R.reduce(
      (l, p) => R.compose(l, lensQuery(p)),
      lensIdentity,
      path
    )
  }
}

// console.log(
//   R.view(
//     // R.compose(R.lensProp('list'), R.lensIndex(0)),
//     lensQuery(['list', 0]),
//     {list: [{id:1, state: 1}]}
//   )
// )

// console.log(
//   R.set(
//     // R.compose(R.lensProp('list'), R.lensIndex(0), R.lensProp('state')),
//     lensQuery(['list', 0, 'state']),
//     2,
//     {list: [{id:1, state: 1}]}
//   )
// )

// console.log(
//   R.view(
//     lensQuery(['list', {id: 1}, 'state']),
//     {list: [{id:1, state: 1}]}
//   )
// )

export const lift = (path, obj) => {
  const lens = lensQuery(path)
  return {
    ...obj,
    // this may be useful for debugging later
    path: path.concat(obj.path),
    // nest the state
    // TODO: this should be _init(state) and init()
    init: (state) => {
      return R.set(
        lens,
        obj.init(
          R.view(lens, state)
        ),
        state
      )
    },
    // unlift action and update nested state
    update: (state, action, payload) => {
      if (isLiftedAction(path, action)) {
        return R.over(
          lens,
          s => obj.update(
            s,
            unliftAction(action),
            payload
          ),
          state
        )
      } else {
        return state
      }
    },
    // TODO I suppose it does make sense for drivers to have a lifting function
    // in order to make things lazy. look for publish and _publish, otherwise
    // this should be undefined
    publish: (dispatch, state) => {
      // TODO: how can we make this lazy
      return obj.publish(
        liftDispatch(dispatch, path),
        R.view(lens, state)
      )
    },
    // TODO look for subscribe and _subscribe, otherwise undefined
    subscribe: (state, pub, props) => {
      return obj.subscribe(
        R.view(lens, state),
        pub,
        props
      )
    },
    // and there is injection happening for lifted components.
    view: (dispatch, state, pub, props) => {
      return lazy(obj.view)(
        liftDispatch(dispatch, path),
        R.view(lens, state),
        obj.subscribe(R.view(lens, state), pub, props),
        props
      )
    }
  }
}

export const Component = (obj) => {
  // set some reasonable defaults
  const component = {
    __type: 'Elmish.Component',
    path: [],
    lifted: [],
    init: () => ({}),
    update: (state, action, payload) => state,
    publish: (dispatch, state) => ({}),
    subscribe: (state, pub, props) => ({}),
    ...obj,
  }
  // because pipe with no arguments throws an error
  // https://github.com/ramda/ramda/issues/1875
  const lifted = R.append({
    init: R.identity,
    update: R.identity,
    publish: R.always({}),
    subscribe: R.always({}),
  }, component.lifted)
  // TODO all of this stuff can be done at the point of comsuption!
  // wire up the lifted sub-components.
  return R.evolve({
    init: (init) => () => {
      const inits = R.map(R.prop('init'), lifted)
      return R.pipe(...inits)(init())
    },
    update: (update) => (state, action, payload) => {
      const fns = R.map(c => s => c.update(s, action, payload), lifted)
      return R.pipe(...fns)(update(state, action, payload))
    },
    publish: (publish) => (dispatch, state) => {
      return R.pipe(
        R.map(c => c.publish(dispatch, state)),
        R.reduce(R.merge, publish(dispatch, state))
      )(lifted)
    },
    subscribe: (subscribe) => (state, pub, props) => {
      return R.pipe(
        R.map(c => c.subscribe(state, pub, props)),
        R.reduce(R.merge, subscribe(state, pub, props))
      )(lifted)
    },
  }, component)
}


export const configure = drivers => app => {
  const event$ = flyd.stream()
  const state$ = flyd.scan(
    (state, {action, payload}) => app.update(state, action, payload),
    app.init(),
    event$
  )
  const _dispatch = (action, payload, ...args) =>
    isFunction(payload) ?
    event$({action, payload: payload(...args)}) :
    event$({action, payload})

  const dispatch = (action, payload) => partial(_dispatch, action, payload)
  const pub$ = flyd.map(state => app.subscribe(state, app.publish(dispatch, state)), state$)

  const handlers = drivers.map(driver => driver(app, dispatch))

  flydLift((state, pub) => {
    handlers.forEach(handler => handler(state, pub))
  }, state$, pub$)
}

const pubsub = {
  middleware: {
    // we should be crawling the app heirarchy and lazily constructing our result
    pub: (app, dispatch) => (state) => app.subscribe(state, app.publish(dispatch, state)),
    // publish: (publish) => (dispatch, state) => {
    //   return R.pipe(
    //     R.map(c => c.publish(dispatch, state)),
    //     R.reduce(R.merge, publish(dispatch, state))
    //   )(lifted)
    // },
    // subscribe: (subscribe) => (state, pub, props) => {
    //   return R.pipe(
    //     R.map(c => c.subscribe(state, pub, props)),
    //     R.reduce(R.merge, subscribe(state, pub, props))
    //   )(lifted)
    // },
  },
  lift: {
    publish: (publish) => (dispatch, state) => {
      // TODO: how can we make this lazy
      return publish(
        liftDispatch(dispatch, path),
        R.view(lens, state)
      )
    },
    // TODO look for subscribe and _subscribe, otherwise undefined
    subscribe: (subscribe) => (state, pub, props) => {
      return subscribe(
        R.view(lens, state),
        pub,
        props
      )
    },
  }
}

const drivers = [
  view,
  hotkeys,
]

export const start = configure(drivers)
