// this needs to be simpler...
// lazy tree works fine for http and other effects involving reducing so long
// as you dont need to change the underlying values...

const R = require('ramda')

const Node = (value, children) => {
  return {
    __type: 'node',
    value,
    children,
  }
}

const LazyNode = (fn, ...args) => {
  return {
    __type: 'lazy-node',
    fn,
    args,
  }
}

const tree2 = x =>
  Node(x * 3, [
    Node(x * 4)
  ])

const tree = Node(10, [
  Node(20),
  LazyNode(tree2, 10)
])

// map can preserve laziness
const mapTree = R.curry((fn, tree) => {
  if (tree.__type === 'lazy-node') {
    return LazyNode(R.compose(fn, tree.fn), ...tree.args)
  }
  return Node(fn(tree.value), (tree.children || []).map(mapTree(fn)))
})

const accumulate = R.curry((fn, init, tree) => {
  if (tree.__type === 'lazy-node') {
    return LazyNode(R.compose(accumulate(fn, init), tree.fn), ...tree.args)
  }

  // uhhh...
  return (tree.children || []).reduce(fn, fn(init, tree.value))
})