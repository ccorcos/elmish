// TODO
// rewrite the core functionality with a few things in mind
// - how do we want to use it and how do we want it to work
// - lifting should make a component work pretty much just like before
// - add runtime validation wherever possible to make things easy on the developer


const emptyPlugin = {
  lift: {},
  middleware:{},
  drivers: {},
}

const mergePlugin = (a, b) => ({
  lift: R.merge(a.lift, b.lift || {}),
  middleware: R.merge(a.middleware, b.middleware || {}),
  drivers: R.merge(a.drivers, b.drivers || {}),
}),

const mergePlugins = (plugins) =>
  plugins.reduce(mergePlugin, emptyPlugin)

const configure = plugins => {

  const spec = mergePlugins(plugins)

  const lift = (path, component) => {
    const lens = lensQuery(path)
    const viewState = R.view(lens)
    const liftDispatch = dispatch => partial(_liftDispatch)(dispatch, path)

    const baseLift = {
      // the component has children, lift each of them
      children: (component.children || []).map(child => lift(path, child)),
      //
      _init: (state) => {
        return R.set(
          lens,
          component._init(viewState(state)),
          state
        )
      },
      // check if the action should be routed to this component, unlift it, and
      // pass it on.
      update: (state, action, payload) => {
        if (isLiftedAction(path, action)) {
          return R.over(
            lens,
            s => component.update(s, unliftAction(action), payload),
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
            s => component.update(s, unliftAction(action), payload),
            state
          )
        } else {
          return state
        }
      },
    }

    const pluginLift = R.map(fn => fn(path, viewState, liftDispatch)(component), spec.lift)

    // all component needs to have an init function so they can construct all
    // of the intermediate states for their children to write to. every component
    // state must be an componentect
    const init = component._init ? {} : {
      init: (state) => {
        return R.set(
          lens,
          (component.init && component.init(viewState(state))) || {},
          state
        )
      },
    }
    return {
      // this may be useful for debugging later
      path: path.concat(component.path || []),
      ...init,
      ...R.pick(R.keys(component), R.merge(baseLift, pluginLift)),
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
