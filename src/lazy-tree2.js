const Node = (value, children) => {
  const obj = {
    __type: 'Node',
    value,
    children,
    equals: b => false,
    reduce: (reducer, init) => Transformation('reduce', obj, reducer, init),
    map: (mapper) => Transformation('map', node, mapper),
    evaluate: (c) => {
      const children = zip(c.remember.children, node.children).map(([r, n]) => n.evaluate(r))
      return Computation(
        Node(node.value, children.map(n => n.result)),
        { name, children },
      )
    }
  }
  return obj
}

const LazyNode = (fn, ...args) => {
  const obj = {
    __type: 'LazyNode',
    fn,
    args,
    equals: b => false,
    reduce: (reducer, init) => Transformation('reduce', obj, reducer, init),
    map: (mapper) => Transformation('map', node, mapper),
    evaluate: (c) => {
      if (obj.equals(c.remember.node)) {
        return c
      }
      const inner = fn(...args).evaluate(c.remember, inner)
      return Computation(
        inner.result,
        { node, inner }
      )
    }
  }
  return obj
}

const Transformation = (name, node, ...args) => {
  const obj = {
    __type: 'Transformation',
    name,
    node,
    args,
    equals: b => false,
    reduce: (reducer, init) => Transformation('reduce', obj, reducer, init),
    map: (mapper) => Transformation('map', node, mapper),
    evaluate: c => {
      if(c.remember.node.equals(node) && name === c.remember.name && args === c.remember.args) {
        return c
      }
      if (name === 'map') {
        const [ mapper ] = args
        const inner = node.evaluate(c.remember.inner)

        // HERE
        // what do we do here? when we evaluate a node, does it go through and
        // remove all the lazy nodes and transformations and return a strict
        // tree? I think that makes sense, especially for reduce. but it means
        // you have to be really careful when mapping over a tree. maybe map
        // can be lazy... that would make sense afterall since there's no need
        // to get the strict value back unless we need it...

        return Computation(
          something,
          { node, name, args, inner }
        )
      }
      if (name === 'reduce') {

      }
    }
  }
  return obj
}

const Computation = (result, remember) => {
  const obj = {
    __type: 'Computation',
    result,
    remember,
  }
}