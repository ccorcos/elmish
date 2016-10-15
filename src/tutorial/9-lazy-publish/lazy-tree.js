// n makes nodes or lazy nodes depending on argument types
// keyed adds a __key property to the node for more efficient zipping
// nodes have a .reduce and .map function which transform values

function node(value, children) {
  return {
    __type: 'node',
    value, // {}
    children, // Tree[]
  }
}

function lazyNode(fn, ...args) {
  return {
    __type: 'lazyNode',
    fn, // arg => Tree
    args,
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
lazyCompNode((equals, computation) => {
  if (equals(node, computate.lazyNode)) {
    return computation
  }
  const c = node.fn(...node.args).reduce(merge, computation)
  return R.evolve({
    result: r => ({one: r})
  }, c)
})












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