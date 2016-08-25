import {compare} from './thunk'
import {zip} from './utils'

// shallow referential equality
const equals = compare((a, b) => a === b)

function reduceNode(fn, prev, node) {
  if (prev.node === node) {
    // the root of the tree isnt always lazy so lets compare nodes for
    // safe measure
    return prev
  } else {
    // if the nodes arent equal
    if (node.children) {
      // recursively evaluate the node's children
      // TODO: zip is pretty naive. we could get better performance by
      // checking if the list was reordered
      const children = zip(prev.children, node.children)
        .map(([pc, nc]) => reduce(fn, pc, nc))
      // gather all of the results
      const result = children.reduce((acc, child) =>
        fn(acc, child.result),
        node.value
      )
      // return an object describing the computation
      return {
        __type: 'computation',
        node,
        result,
        children,
      }
    } else {
      // if there are no children then the result is the node's value
      return {
        __type: 'computation',
        node,
        result: node.value,
        children: [],
      }
    }
  }
}

function reduceThunk(fn, prev, thunk) {
  if (equals(thunk, prev.thunk)) {
    // if the previous thunk equals this thunk, then the resulting computation
    // is the same
    return prev
  } else {
    // otherwise, evaluate the thunk to get the tree
    const node = thunk()
    // reduce on the node and add this thunk to the computation
    return {
      ...reduceNode(fn, prev, node),
      thunk,
    }
  }
}

// this function will lazily construct the result of a tree
// fn merges values, prev is the last computation, and next is a (lazy?) tree
// its important that fn returns the same type as its input.
function reduce(fn, prev, next) {
  if (prev) {
    // check if there is a previous computation so we can be lazy
    if (next.__type === 'thunk') {
      // if the our tree is lazy
      return reduceThunk(fn, prev, next)
    } else {
      // if next is a node
      return reduceNode(fn, prev, next)
    }
  } else {
    // if there is no previous computation, compute the whole thing
    const empty = {children: []}
    if (next.__type === 'thunk') {
      // if the our tree is lazy
      return reduceThunk(fn, empty, next)
    } else {
      // if next is a node
      return reduceNode(fn, empty, next)
    }
  }
}

export default reduce
