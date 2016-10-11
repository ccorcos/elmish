// TODO
// - lazy tree

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
    } else {
      return tree[name]
    }
  }
}

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

const plugin = {
  middleware: {
    pub: (app, dispatch) => (state) => {
      // check for _subscribe and _publish. if they exist then dont crawl any deeper
      const publish = reduce(
        'publish',
        (p1, p2) => (dispatch, state) => R.merge(p1(dispatch, state), p2(dispatch, state)),
        (p1, p2) => (dispatch, state) => R.merge(p1(dispatch, state), p2(dispatch, state)),
        app
      )
      const subscribe = reduce(
        'subscribe',
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        app
      )
      return publish && subscribe && subscribe(state, publish(dispatch, state))
    },
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