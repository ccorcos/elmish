// TODO
// - lazy tree

const plugin = {
  middleware: {
    pub: (app, dispatch) => (state) =>
      app.subscribe(state, app.publish(dispatch, state)),
  },
  lift: {
    // _publish
    publish: (path, viewState, liftDispatch) => (obj) => (dispatch, state) =>
      obj.publish(liftDispatch(dispatch), viewState(state)),
    // _subscribe
    subscribe: (path, viewState, liftDispatch) => (obj) => (state, pub, props) =>
      obj.subscribe(viewState(state), pub, props),
  }
}

export default plugin