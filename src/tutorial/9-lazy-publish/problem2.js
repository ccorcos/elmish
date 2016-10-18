// the goal here is to be able to build up a computational tree

const Node = (value, children) => {
  const obj = {
    __type: 'node',
    value,
    children,
  }
  obj.equals = b => obj === b
  obj.map = fn => MapNode(fn, obj)
  obj.reduce = (fn, init) => ReduceNode(fn, init, obj)
  obj.evaluate = comp => {
    if (comp && eq(comp.node, obj)) {
      return comp
    }
    if (comp && comp.node.__type === 'node') {
      const children = zip(comp.children, obj.children).map(([c, n]) => n.evaluate(c))
      const result = Node(obj.value, children.map(c => c.result))
      return Computation(obj, result, children)
    }
    const children = obj.children.map((n) => n.evaluate())
    const result = Node(obj.value, children.map(c => c.result))
    return Computation(obj, result, children)
  }
  return Object.freeze(obj)
}

const LazyNode = (fn, args) => {
  const obj = {
    __type: 'lazy-node',
    fn,
    args,
  }
  obj.equals = b => b
                 && b.__type === 'lazy-node'
                 && eq(b.fn, obj.fn)
                 && eqArray(b.args, obj.args)
  obj.map = fn => MapNode(fn, obj)
  obj.reduce = (fn, init) => ReduceNode(fn, init, obj)
  obj.evaluate = comp => {
    if (comp && eq(comp.node, obj)) {
      return comp
    }
    if (comp && comp.node.__type === 'lazy-node') {
      const children = obj.fn(...obj.args).evaluate(comp.children)
      return Computation(obj, children.result, children)
    }
    const children = obj.fn(...obj.args).evaluate()
    return Computation(obj, children.result, children)
  }
  return Object.freeze(obj)
}

const ReduceNode = (reducer, init, node) => {
  const obj = {
    __type: 'reduce-node',
    reducer,
    init,
    node,
  }
  obj.equals = b => b
                 && b.__type === 'reduce-node'
                 && eq(b.reducer, obj.reducer)
                 && equals(b.init, obj.init) // deep equals
                 && eq(b.node, obj.node)
  obj.map = fn => MapNode(fn, obj)
  obj.reduce = (fn, init) => ReduceNode(fn, init, obj)
  obj.evaluate = comp => {
    if (comp && eq(comp.node, obj)) {
      return comp
    }
    if (comp && comp.node.__type === 'reduce-node') {
      const evalComp = obj.node.evaluate(comp.children.evaluate)
      const node = evalComp.result
      const children = zip(comp.children.reduction, node.children).map(([c, n]) => n.evaluate(c))








      return Computation(obj, children.result, children)
    }

    return Computation(obj, children.result, children)

  }
  return Object.freeze(obj)
}

const MapNode = (mapper, node) => {
  const obj = {
    __type: 'map-node',
    mapper,
    node,
  }
  obj.equals = b => b
                 && b.__type === 'map-node'
                 && eq(b.mapper, obj.mapper)
                 && eq(b.node, obj.node)
  obj.map = fn => MapNode(fn, obj)
  obj.reduce = (fn, init) => ReduceNode(fn, init, obj)
  return Object.freeze(obj)
}

// ---
const Tree = (node, comp) => {
  const obj = {
    __type: 'tree',
    node,
    comp,
  }
  return obj
}

const Computation = (node, result, children) => {
  const obj = {
    __type: 'computation',
    node,
    result,
    children,
  }
}

// node.reduce reduces the value and returns a node
// tree.reduce reduces the node and returns a tree

const evaluateTree = (tree) => {
  if (tree.node.__type === 'map-node') {
    if (tree.comp.node.__type === 'map-node') {
      const newTree = evaluateTree(Tree(tree.node.node, tree.comp.children))
      newTree.map
    }
  }
  if (tree.node.__type === 'reduce-node') {

  }
  if (tree.node.__type === 'lazy-node') {

  }
}

const reduceTree = (reducer, init, tree) => {
  if (eq(tree.node, tree.comp.node)) {
    return tree
  }
  if (tree.node.__type === 'map-node') {

  }
  if (tree.node.__type === 'reduce-node') {

  }
  if (tree.node.__type === 'lazy-node') {

  }
}
