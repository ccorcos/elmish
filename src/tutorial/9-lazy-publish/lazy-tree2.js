// you can only map over the result or reduce the result

// Tree :: Node | LazyNode
// children :: [ Tree ]
// node :: value -> children -> Node value children
// lazyNode :: fn => (args -> tree) : fn -> args -> LazyNode fn args
// compTree :: Tree -> Computation -> CompTree Tree Computation
// reduce :: (Computation -> Tree -> Computation) -> Computation -> CompTree

// we need to think with stronger type signatures.
// - computation is what we're accumulating in the reduction.
// - nodes and lazy nodes need to wait for their computations to evaluate.
// - reducing nodes is reducing values but that doesnt actually happen until we have the computation














const eq = (a, b) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  if (a.equals) {
    return a.equals(b)
  }
  return false
}

const eqArray = (a, b) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  if (a.length !== b.length) {
    return false
  }
  for (var i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false
    }
  }
  return false
}

const partial = fn => (...args) => {
  const _fn = (...more) => fn(...args.concat(more))
  _fn.__type = 'partial'
  _fn.fn = fn
  _fn.args = args
  _fn.equals = b => {
    if (!b) {
      return false
    }
    if (b.__type !== 'partial') {
      return false
    }
    if (!eq(_fn.fn, b.fn)) {
      return false
    }
    if (!eqArray(_fn.args, b.args)) {
      return false
    }
    return true
  }
  return Object.freeze(_fn)
}

const node = (value, children) => {
  const obj = Object.freeze({
    __type: 'node',
    value,
    children,
    equals: b => obj === b,
    // map: fn => node(fn(obj.value), children),
  })
  return obj
}

// const mapFn = partial((mapper, fn, ...args) => mapper(fn(...args)))

const lazyNode = (fn, ...args) => {
  const obj = Object.freeze({
    __type: 'lazyNode',
    fn,
    args,
    equals: b => {
      if (obj === b) {
        return true
      }
      if (!b) {
        return false
      }
      if (b.__type !== 'lazyNode') {
        return false
      }
      if (!eq(obj.fn, b.fn)) {
        return false
      }
      if (eqArray(obj.args, b.args)) {
        return false
      }
      return true
    },
    evaluate: () => obj.fn(...obj.args),
    // map: f => lazyNode(mapFn(f, obj.fn), ...obj.args)
  })
  return obj
}

const reduceNode = (reducer, init, node) => {
  return {
    __type: 'reduceNode',
    node,
    init,
    reducer,
  }
}

const mapNode = (mapper, node) => {
  return {
    __type: 'mapNode',
    node,
    mapper,
  }
}

const tree = (node, computation) => {
  return {
    __type: 'lazyTree',
    node,
    computation,
    reduce: (reducer, init) => {
    }
  }
}












const App = {
  subscribe: state => {
    return node({}, [
      lazyNode(Game.subscribe, state.game1),
      lazyNode(Game.subscribe, state.game2),
    ])
  },
  publish: ({dispatch, state}) => {
    return node({}, [
      lazyNode(Game.publish, {
        dispatch: forward(dispatch, 'game1'),
        state: state.game1,
      }),
      lazyNode(Game.publish, {
        dispatch: forward(dispatch, 'game2'),
        state: state.game2,
      })
    ])
  },
}

const App = {
  subscribe: state => {
    return node({}, [
      lazyNode(Game.subscribe, state.game1).reduce(merge, {}).map(result => ({game1: result})),
      lazyNode(Game.subscribe, state.game2).reduce(merge, {}).map(result => ({game2: result})),
    ])
  },
  publish: ({dispatch, state}) => {
    return node({}, [
      lazyNode(Game.publish, {
        dispatch: forward(dispatch, 'game1'),
        state: state.game1,
      }).reduce(merge, {}).map(result => ({game1: result})),
      lazyNode(Game.publish, {
        dispatch: forward(dispatch, 'game2'),
        state: state.game2,
      }).reduce(merge, {}).map(result => ({game2: result})),
    ])
  },
}



























const computeNode = computation => {
  tree(node({}, [
    lazyNode(Game.subscribe, state.game1).reduce(merge, {}).map(subs => ({game1: subs})),
    lazyNode(Game.subscribe, state.game2).reduce(merge, {}).map(subs => ({game1: subs})),,
  ]), computation)
  .reduce(merge, {})
  .map(obj => ({something: obj}))
}
//
// const subscribe = state => {
//   return node({}, [
//     lazyNode(Game.subscribe, state.game),
//     lazyNode(Dashboard.subscribe, state.dasboard),
//   ])
// },
//
//
// lazyTree((equals, computation) => {
//   if (equals(node, computation.lazyNode)) {
//     return computation
//   }
//   const c = node.fn(...node.args).reduce(merge, computation)
//   return R.evolve({
//     result: r => ({one: r})
//   }, c)
// })

// subscribe: state => {
//   return node({}, [
//     lazyNode(Game.subscribe, state.game),
//     lazyNode(Dashboard.subscribe, state.dasboard),
//   ])
// },
// publish: ({dispatch, state}) => {
//   return node({}, [
//     lazyNode(Health.publish, {
//       dispatch: forward(dispatch, 'health'),
//       state: state.health,
//     })
//   ])
// },

// we need something that has a tree and a computation to reduce over and we
// also need to somehow chain over that



function tree(node, computation) {
  return {
    __type: 'tree',
    node,
    computation,
    reduce: (reducer, init) =>
  }
}










const tree = node({count: 1}, [
  node({count: 1}),
  lazyNode(n => node({count: n}, [
    node({count: n*2}),
  ]), 1)
])

computation = tree.reduce((a,b) => a + b.count, 0, computation) // 5

zippedComp = zip(computation, tree).reduce(...)


// node, lazyNode, compNode, computation

// monadic bind!
lazyCompNode(node => (equals, computation) => {
  if (equals(node, computation.lazyNode)) {
    return computation
  }
  const c = node.fn(...node.args).reduce(merge, computation)
  return R.evolve({
    result: r => ({one: r})
  }, c)
}, node)









function reduceLazyTree(equals, reducer, prev, next) {
  // check if there is a previous computation so we can be lazy
  if (next.__type === 'lazyNode') {
    // if the our tree is lazy
    return reduceLazyNode(equals, reducer, prev, next)
  }
  if (next.__type === 'compNode') {
    return next(equals, prev)
  }
  // if next is a node
  return reduceNode(equals, reducer, prev, next)
}

function reduceLazyNode(equals, reducer, prev, lazyNode) {
  if (prev && prev.lazyNode && equals(lazyNode, prev.lazyNode)) {
    // if the previous lazyNode equals this lazyNode, then the resulting computation
    // is the same
    return prev
  }
  // otherwise, evaluate the lazyNode to get the tree
  const node = lazyNode.fn(...lazyNode.args)
  // reduce on the node and add this lazyNode to the computation
  const computation = reduceNode(equals, reducer, prev, node)
  return {
    ...computation,
    lazyNode,
  }
}

function reduceNode(equals, reducer, prev, node) {
  if (node.children && node.children.length > 0) {
    // recursively evaluate the node's children
    const children = zip((prev && prev.children) || [], node.children)
      .map(([child, comp]) => reduceLazyTree(equals, reducer, comp, child))
    // gather all of the results
    const result = children
      .map(comp => comp.result)
      .concat([node.value])
      .reduce(reducer)
    // return an object describing the computation
    return {
      __type: 'computation',
      node,
      result,
      children,
    }
  }
  // if there are no children then the result is the node's value
  return {
    __type: 'computation',
    node,
    result: node.value,
    children: [],
  }
}

// zip but return length of primary list
function zip(secondary, primary) {
  const result = []
  let idx = 0
  while (idx < primary.length) {
    result[idx] = [primary[idx], secondary[idx]]
    idx += 1
  }
  return result
}


// WIP
// - lazy tree
//   - map over tree
//   - meta nodes
//     - keyed
//     - isolate... generic version?


// tree operations
// - reduce tree values
// - map tree values
// - diff tree
