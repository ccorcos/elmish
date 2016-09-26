
// value must be a {} and children must be a [node]
export function node(value, children) {
  return {
    __type: 'node',
    value,
    children,
  }
}

export function lazyNode(fn, args) {
  return {
    __type: 'lazyNode',
    fn,
    args,
  }
}

// this function will lazily construct the result of a reducing all the values
// recursively through a tree. its important that reducer returns the same type as
// its input. prev is the previous computation -- the result of the last
// time called to reduce and next is a tree with potentially lazy nodes.
export function reduceLazyTree(equals, reducer, prev, next) {
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
    const children = merge((prev && prev.children) || [], node.children)
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
export function merge(secondary, primary) {
  const result = []
  let idx = 0
  while (idx < primary.length) {
    result[idx] = [primary[idx], secondary[idx]]
    idx += 1
  }
  return result
}
