import R from 'ramda'

// TODO:
// - unit tests, performance
// - performance testing
//   - speed
//   - memory
// - the transformations could be lazy too
// - keyed nodes
// - better zip function

export const Node = (value, children) => {
  const obj = {
    __type: 'Node',
    value,
    children,
  }

  obj.equals = (other) => Node.equals(other, obj)
  obj.evaluate = (computation) => Node.evaluate(computation, obj)
  addTransformations(obj)

  return obj
}

export const LazyNode = (fn, args) => {
  const obj = {
    __type: 'LazyNode',
    fn,
    args,
  }

  obj.equals = (other) => LazyNode.equals(other, obj)
  obj.evaluate = (computation) => LazyNode.evaluate(computate, obj)
  addTransformations(obj)

  return obj
}

const TransformNode = (transformation, args, node) => {
  const obj = {
    __type: 'TransformNode',
    node,
    transformation,
    args,
  }

  obj.equals = (other) => TransformNode.equals(other, obj)
  obj.evaluate = (computation) => TransformNode.evaluate(computate, obj)
  addTransformations(obj)

  return obj
}

// deep comparison
const compareKeys = (keys) => (a, b) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  return R.equals(
    R.pick(keys, a),
    R.pick(keys, b)
  )
}

Node.equals = compareKeys(['__type', 'value', 'children'])
LazyNode.equals = compareKeys(['__type', 'fn', 'args'])
TransformNode.equals = compareKeys(['__type', 'node', 'transformations', 'args'])

// A type to contain the result and information used to compute the result
const Computation = (result, previous) => {
  const obj = {
    __type: 'Computation',
    result,
    previous,
  }
}

// evaluate the node and it's children given the previous computation
Node.evaluate = (computation, node) => {
  // recursively evaluate children
  const childrenComputations = zip(
    computation.previous.childrenComputation,
    node.children
  ).map(([childComputation, child]) => {
    return child.evaluate(childComputation)
  })
  // gather the results
  const newChildren = childrenComputations.map((childComputation) => {
    return childComputation.result
  })
  // create the resulting Node
  const result = Node(node.value, newChildren)
  // remember the previous children computations for next time
  const previous = { childrenComputation }
  return Computation(result, previous)
}

// evaluate the node and it's children given the previous computation
LazyNode.evaluate = (computation, node) => {
  // check to see if the previous computation was the same
  if (LazyNode.equals(computation.previous.node, node)) {
    return computation
  }
  // evaluate the lazy node and its children
  const innerComputation = node.fn(...node.args).evaluate(computation.previous.innerComputation)
  // get the result
  const result = innerComputation.result
  // remember the inner computation and the lazy node
  const previous = { node, innerComputation }
  return Computation(result, previous)
}

const getInnerNode = (node) => {
  if (node.__type === 'Node' || node.__type === 'LazyNode') {
    return node
  } else {
    return getInnerNode(node.node)
  }
}

const transformations = {
  map: (fn, node) => {
    return Node(
      fn(node.value),
      (node.children || [])
      .map(child => transformations.map(fn, node))
    )
  },
  reduce: (reducer, init, node) => {
    return Node(
      (node.children || [])
      .map(child => transformations.reduce(reducer, init, child))
      .concat(node.value)
      .reduce(reducer, init)
    )
  },
  filter: (fn, node) => {
    if (fn(node.value)) {
      return Node(
        node.value,
        (node.children || [])
        .map(child => transformations.filter(fn, child))
        .filter(Boolean)
      )
    }
  },
}

const addTransformations = (obj) => {
  R.keys(obj).forEach((transformation) => {
    obj[transformation] = (...args) => TransformNode(transformation, args, obj),
  })
}


// evaluate the node and it's children given the previous computation
TransformNode.evaluate = (computation, node) => {
  // if this transformation is on a LazyNode, the we can evaluate these
  // transformations lazily. Otherwise, we don't want to do an expensive
  // deep comparison of a Node.
  const innerNode = getInnerNode(node)
  if (innerNode.__type === 'LazyNode') {
    if (TransformNode.equals(computation.previous.node, node)) {
      return computation
    }
  }

  const innerComputation = node.node.evaluate(computation.previous.innerComputation)
  const result = transformations[node.transformations](...args, innerComputation.result)
  const previous = { node, innerComputation }
  return Computation(result, previous)
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