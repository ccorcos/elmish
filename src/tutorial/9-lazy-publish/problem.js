// In order to make publish performant, we need to lazily compute the publish
// object, and then also allow components to subscribe to keys of the pubs.

// The naive approach looks like this:

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
  // PROBLEM 1: these namespaces will collide!
  subscribe: state => {
    return node({},
      lazyNode(kind.subscribe, state.one),
      lazyNode(kind.subscribe, state.two),
    )
  },
  // PROBLEM 1: these namespaces will collide!
  publish: ({dispatch, state}) => {
    return node({},
      lazyNode(kind.publish, {
        dispatch: forward(dispatch, 'one'),
        state: state.one,
      }),
      lazyNode(kind.publish, {
        dispatch: forward(dispatch, 'two'),
        state: state.two,
      }),
    )
  },
  // PROBLEM 2: we need to non-lazily recompute subscribe a bunch of times here!
  view: lazy(({dispatch, state, pubs}) => (
    <div>
      {kind.view({
        dispatch: forward(dispatch, 'one'),
        state: state.one,
        pubs: R.pick(R.keys(kind.subscribe(state.one).reduce(merge, {})), pubs),
      })}
      {kind.view({
        dispatch: forward(dispatch, 'two'),
        state: state.two,
        pubs: R.pick(R.keys(kind.subscribe(state.two).reduce(merge, {})), pubs),
      })}
    </div>
  )),
})

// Reduce returns a node with the result as the value and a computation object
// that contains all of the intermediary results. Rather than subscribing twice,
// we can just find that intermediary subscribe reduction and pick against
// the pubs with those values.

// Then in terms of actually namespacing everything we need to create some
// notion of reducing and mapping that will wait for a computation to actually
// be evaluated lazily.

const twoOf = kind => {
  return {
    // ...
    subscribe: state => {
      return node({},
        lazyNode(kind.subscribe, state.one).reduce(merge, {}).map(obj => ({one: obj})),
        lazyNode(kind.subscribe, state.two).reduce(merge, {}).map(obj => ({one: obj})),
      )
    },
    publish: ({dispatch, state}) => {
      return node({},
        lazyNode(kind.publish, {
          dispatch: forward(dispatch, 'one'),
          state: state.one,
        }).reduce(merge, {}).map(obj => ({one: obj})),
        lazyNode(kind.publish, {
          dispatch: forward(dispatch, 'two'),
          state: state.two,
        }).reduce(merge, {}).map(obj => ({one: obj})),
      )
    },
    view: lazy(({dispatch, state, pubs}) => (
      <div>
        {kind.view({
          dispatch: forward(dispatch, 'one'),
          state: state.one,
          pubs: pubs.pick(subs.get(0)),
        })}
        {kind.view({
          dispatch: forward(dispatch, 'two'),
          state: state.two,
          pubs: pubs.pick(subs.get(1)),
        })}
      </div>
    )),
  }
}

// TODO:
// - need a new data type which is a node and a computation
//   - reduce over this tree will actually run
// - nodes can be transformed with map and reduce
//   - dont evaluate until inside a tree with a computation
// - keyed items can be accessed by name so we can get the intermediate reduced
//   result of the subscription using subs.get

const node = (value, children) => {
  const obj = {
    __type: 'node',
    value,
    children,
  }
  return obj
}

const keyed = (key, node) => {
  const obj = {
    ...node,
    __key: key,
  }
  return obj
}

const lazyNode = (fn, ...args) => {
  const obj = {
    __type: 'lazy-node',
    fn,
    args,
  }
  return obj
}

const tree = (node, comp) => {
  const obj = {
    __type: 'tree',
    node,
    comp,
  }
}

const computation = (name, ...args) => (node, result) => {
  return {
    __type: 'computation',
    name,
    args,
    node,
    result,
  }
}


// suppose lazy nodes need to be able to compare themselves. or maybe the tree
// itself can be initialized with that comparator...
const reduceTree = (reducer, init, tree) => {
  if (tree.node.__type === 'lazy-node') {
    if (tree.comp) {
      if (tree.comp.__type === 'reduced-node') {
        if (eq(tree.comp.reducer, reducer)) {
          if (eq(tree.comp.init, init)) {
            if (eq(tree.node, tree.comp.node)) {
              return tree
            }
          }
        }
      }
    }
    const node = tree.node.fn(...tree.node.args)
    const newTree = reduceTree(reducer, init, tree(node, tree.comp))
    return tree(tree.node, {
      ...newTree.comp,
      node: tree.node,
    })
  }

}

if (isLazy(node)) {
  // must check that the computation compares a reduce with the same function!
  if (comp && eq(node, comp.node)) {
    return Tree(node, comp)
  }
  const tree = transform(evaluate(node), comp.transform)
  const children = zip(tree.comp.children, tree.node.children)
    .map(([comp, node]) => Tree(node, comp).reduce(fn, init))

  // gather all of the results
  const result = children
    .map(tree => tree.comp.result)
    .concat([tree.node.value])
    .reduce(fn, init)

  return Tree(node, {
    __type: 'Computation',
    transform: tree.transform,
    result,
    node,
    children,
  })
}