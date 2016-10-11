

const config = {
  // middleware lets you interpret the entire state + component tree into
  // something that might be useful for all drivers. drivers are free to derive
  // these things themselves so these should be relevant. pub/sub is a perfect
  // example. the key is the key of the args send to drivers. the important work
  // to be done here is stepping through the component tree, and lazily reducing
  // all the component values. this is where you may also want to define semantics
  // for overriding the wiring mechanism so a component can control its child
  // components directly.
  // again, middleware is for deriving state. its quite likely that what you want
  // to build is going to be a component or a driver. replaying state should
  // belong here.
  middleware: {
    pub: (app, dispatch) => (state) =>
      app.subscribe(state, app.publish(dispatch, state)),
  },
  // lifters take a path over which to localize the component within the global
  // event dispatcher and the state. we're basically given a path and a lens and
  // then we gener...
  // TODO pass lifters for state and dispatch with path and lens bound? or get
  //      rid of lens and derive it here when you want it\
  // what we're really doing here is matching the semantics of either the driver
  // or the middleware, getting the previous function, and replacing it with a
  // function
  lift: {
    // _publish
    publish: (path, lens) => (obj) => (dispatch, state) => {
      return lazy(obj.publish)(
        liftDispatch(dispatch, path),
        R.view(lens, state)
      )
    },
    // _subscribe
    subscribe: (path, lens) => (obj) => (state, pub, props) => {
      return lazy(obj.subscribe)(
        R.view(lens, state),
        pub,
        props
      )
    },
    view: (path, lens) => (obj) => (dispatch, state, pub, props) => {
      return lazy(obj.view)(
        liftDispatch(dispatch, path),
        R.view(lens, state),
        obj.subscribe(
          R.view(lens, state),
          pub,
          props
        ),
        props
      )
    },
    hotkeys,
    http,
  },
  // drivers get the state and anything else that might be derived in
  // the middleware
  drivers: {
    react: (app, dispatch) => ({state, pub}) => {
      const html = app.view(dispatch, state, pub)
      ReactDOM.render(html, root)
    }
  }
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
