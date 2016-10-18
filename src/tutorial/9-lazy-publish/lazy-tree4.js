// TODO:
// - start with the original lazy tree
//   - tree is a node and a computation
//   - nodes know how to compare themselves
//   - chain lets you continue the computation arbitrarily


const node = (value, children) => {
  const obj = {
    __type: 'node',
    value,
    children,
  }
  obj.equals = b => obj === b
  return obj
}

const lazy = (fn, ...args) => {
  const obj = {
    __type: 'lazy',
    fn,
    args,
  }
  obj.equals = b => b
                 && b.__type === 'lazy'
                 && eq(b.fn, obj.fn)
                 && eqArray(b.args, obj.args)
  return obj
}

// const chain = (fn, node) => {
//   const obj = {
//     __type: 'chain',
//     fn,
//     node,
//   }
//   return obj
// }

const tree = (node, comp) => {
  const obj = {
    __type: 'tree',
    node,
    comp,
  }
  obj.reduce = (reducer, init) => reduceTree(reducer, init, obj)
  return obj
}

const reduceTree = (reducer, init, tree) => {
  if (tree.node.__type === 'chain') {
    if (tree.comp.operation === 'chain') {
      if (eq(tree.node, tree.comp.node)) {
        return tree
      }
      const result = tree.node.fn(Tree(tree.node.node, tree.comp.inside))
      const comp = {
        __type: 'computation',
        operation: 'chain',
        node: tree.node,
        value: result.node,
        inside: result.comp,
      }
      return Tree(result.node, comp)
    }
    const result = tree.node.fn(Tree(tree.node.node, undefined))
    const comp = {
      __type: 'computation',
      operation: 'chain',
      node: tree.node,
      value: result.node,
      inside: result.comp,
    }
    return Tree(result.node, comp)
  }
  if (tree.node.__type === 'lazy') {
    if (tree.comp.operation === 'reduce') {
      if (eqArray(tree.comp.args, [reducer, init])) {
        if (eq(tree.node, tree.comp.node)) {
          return tree
        }
        // evaluate the lazy node
        const node = tree.node.fn(...tree.node.args)
        // evaluate children recursively
        const children = zip(node.children, tree.comp.children).map(([n, c]) => Tree(n, c).reduce(reducer, init))
        // accumulate the reduced value
        const value = children.map(t => t.node.value).reduce(reducer, reducer(init, node.value))
        // remember this computation for comparison later
        const comp = {
          __type: 'computation',
          operation: 'reduce',
          args: [reducer, init],
          node: tree.node,
          value: Node(value),
          children,
        }
        // return a tree
        return Tree(Node(value), comp)
      }
    }
    // evaluate the lazy node
    const node = tree.node.fn(...tree.node.args)
    const children = zip(node.children, []).map(([n, c]) => Tree(n, c).reduce(reducer, init))
    const value = children.map(t => t.node.value).reduce(reducer, reducer(init, node.value))
    const comp = {
      __type: 'computation',
      operation: 'reduce',
      args: [reducer, init],
      node: tree.node,
      value: Node(value),
      children,
    }
    // return a tree
    return Tree(Node(value), comp)
  }
  const children = zip(tree.node.children, tree.comp.children).map(([n, c]) => Tree(n, c).reduce(reducer, init))
  const value = children.map(t => t.node.value).reduce(reducer, reducer(init, node.value))
  const comp = {
    __type: 'computation',
    operation: 'reduce',
    args: [reducer, init],
    node: tree.node,
    value: Node(value),
    children,
  }
  // return a tree
  return Tree(Node(value), comp)
}

const mapTree = (mapper, tree) => {
  if (tree.node.__type === 'lazy') {
    if (tree.comp.operation === 'map') {
      if (eqArray(tree.comp.args, [mapper])) {
        if (eq(tree.node, tree.comp.node)) {
          return tree
        }
        // evaluate the lazy node
        const node = tree.node.fn(...tree.node.args)
        // evaluate children recursively
        const children = zip(node.children, tree.comp.children).map(([n, c]) => Tree(n, c).map(mapper))
        // map the node value
        const value = Node(mapper(node.value), children.map(t => t.node))
        // remember this computation for comparison later
        const comp = {
          __type: 'computation',
          operation: 'map',
          args: [mapper],
          node: tree.node,
          value,
          children,
        }
        // return a tree
        return Tree(value, comp)
      }
    }
    // evaluate the lazy node
    const node = tree.node.fn(...tree.node.args)
    const children = zip(node.children, []).map(([n, c]) => Tree(n, c).map(mapper))
    const value = Node(mapper(node.value), children.map(t => t.node))
    const comp = {
      __type: 'computation',
      operation: 'map',
      args: [mapper],
      node: tree.node,
      value,
      children,
    }
    // return a tree
    return Tree(value, comp)
  }
  const children = zip(tree.node.children, []).map(([n, c]) => Tree(n, c).map(mapper))
  const value = Node(mapper(tree.node.value), children.map(t => t.node))
  const comp = {
    __type: 'computation',
    operation: 'map',
    args: [mapper],
    node: tree.node,
    value,
    children,
  }
  // return a tree
  return Tree(value, comp)
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
  subscribe: state => {
    return node({},
      chain(
        tree => tree.reduce(merge, {}).map(one => ({one})),
        lazyNode(kind.subscribe, state.one)
      ),
      chain(
        tree => tree.reduce(merge, {}).map(two => ({two})),
        lazyNode(kind.subscribe, state.two)
      ),
    )
  },
  publish: ({dispatch, state}) => {
    // we need some way of mapping over the result of the reduction in order
    // to namespace each of these publications...
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