// n makes nodes or lazy nodes depending on argument types
// keyed adds a __key property to the node for more efficient zipping
// nodes have a .reduce and .map function which transform values

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
  return _fn
}

const id = x => x
const map = partial((fn, obj) => obj.map(fn))
const reduce = partial((fn, init, obj) => obj.reduce(fn, init))
const compose = partial((a, b, c) => a(b(c)))

function Node(value, children, transform=id) {
  return {
    __type: 'Node',
    value,
    children,
    transform: transform,
    map: fn => Node(value, children, compose(map(fn), transform)),
    reduce: (fn, init) => Node(value, children, compose(reduce(fn, init), transform)),
    equals: node => node
                 && node.__type === 'Node'
                 && eq(node.value, value)
                 && eqArray(node.children, children)
                 && eq(node.transform, transform)
  }
}

const isLazy = node => typeof node.value === 'function'
const evaluate = node => node.value(...node.args)
const transform = (node, comp) => node.transform(Tree(node, comp))

function Tree(node, comp) {
  return {
    __type: 'Tree',
    node,
    comp,
    reduce: (fn, init) => {
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
    },
    map: fn => {
      if (isLazy(node)) {
        // must check that the computation compares a map with the same function!
        if (comp && eq(node, comp.node)) {
          return Tree(node, comp)
        }
        const tree = transform(evaluate(node), comp.transform)
        const children = zip(tree.comp.children, tree.node.children)
          .map(([comp, node]) => Tree(node, comp).map(fn))

        // map over the comutation result? or all the value of the tree?
        // FUCK

      }
    }
  }
}

function reduceLazyTree(equals, reducer, prev, next) {
  // check if there is a previous computation so we can be lazy
  if (next.__type === 'lazyNode') {
    // if the our tree is lazy
    return reduceLazyNode(equals, reducer, prev, next)
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










// ---------------------------

const tree = {
  value: 10,
  children: [{
    value: 20,
  }, {
    args: [10],
    fn: (x) => ({
      value: x * 3,
      children: [{
        value: x * 4,
      }]
    }),
  }]
}

const map = fn => tree => {
  if (tree.fn) {
    return map(fn)(tree.fn(...tree.args))
  }
  return R.evolve({
    value: fn,
    children: R.map(map(fn)),
  }, tree)
}

const reduce = (fn, init) => tree => {
  if (tree.fn) {
    return reduce(fn, init)(tree.fn(...tree.args))
  }
  return (tree.children || []).reduce(fn, fn(init, tree.value))
}

// map and reduce operate on the tree's values, however they both return trees
// that contain the resulting computation and the result.

// map applies a fn to the value of every node in the tree lazily
const map = fn => tree => prev => {
  if (tree.fn) {
    if (prev && prev.fn && equals(tree, prev)) {
      return prev
    }
    return map(fn)(R.merge(tree, tree.fn(...tree.args)))(prev)
  }
  return {
    ...tree,
    value: fn(tree.value),
    children: zip(tree.children, prev.children).map(([n, c]) => map(fn)(n)(c))
  }
}

// reduce reduces the values of the tree but returns a tree with all the intermediary values
const reduce = (fn, init) => tree => prev => {
  if (tree.fn) {
    if (prev && prev.fn && equals(tree, prev)) {
      return prev
    }
    return reduce(fn, init)(R.merge(tree, tree.fn(...tree.args)))(prev)
  }
  const children = zip(tree.children, prev.children).map(([n, c]) => reduce(fn, init)(n)(c))
  return {
    ...tree,
    children,
    value: children.reduce((value, node) => fn(value, node.value), fn(init, tree.value)),
  }
}

// every lazy tree method returns an isomorphic tree with all intermediary results


// I need to be able to map and reduce over a tree and remember the entire computation!

const computation = (fn, ...args) => {
  return {
    fn,
    args
  }
}

// should we only ever reduce on a lazy node -- I think not.
// should lazynode().reduce() remember only the result of the reduce -- I think so.

// if reduce returns a tree, then its parent reducer will re-reduce! ahh!!!

prev = {
  prev: [{comp: {fn: map, args: [add1]}, value: 13, children: []}]
  next: [{comp: {fn, args}, value: 12, children: []}]
  value: 12,
  children: [],
}

// map applies a fn to the value of every node in the tree lazily
const map = fn => tree => prev => {
  if (tree.fn) {
    if (prev && prev.fn && equals(tree, prev)) {
      return prev
    }
    return map(fn)(R.merge(tree, tree.fn(...tree.args)))(prev)
  }
  return {
    ...tree,
    value: fn(tree.value),
    children: zip(tree.children, prev.children).map(([n, c]) => map(fn)(n)(c))
  }
}

// reduce reduces the values of the tree but returns a tree with all the intermediary values
const reduce = (fn, init) => tree => prev => {
  if (tree.fn) {
    if (prev && prev.fn && equals(tree, prev)) {
      return prev
    }
    return reduce(fn, init)(R.merge(tree, tree.fn(...tree.args)))(prev)
  }
  const children = zip(tree.children, prev.children).map(([n, c]) => reduce(fn, init)(n)(c))
  return {
    ...tree,
    children,
    value: children.reduce((value, node) => fn(value, node.value), fn(init, tree.value)),
  }
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
