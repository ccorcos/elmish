import R from 'ramda'
import { partial } from 'elmish/v10/z'

const thunk = partial

const isArray = x => Object.prototype.toString.apply(x) === '[object Array]'

const t = (value, children) => {
  if (isArray(value)) {
    children = value
    value = undefined
  }
  // value is an object
  // children is an array
  // if children contain a "key" then the diff algorithm will attempt to an optimal
  // reordering. otherwise it will diff in order.

  return {
    __type: 'tree',
    value,
    children,
  }
}

// what do we want to do?
// - hotkeys problem
// - virtualdom problem

// basically want to be able to diff and reduce...



const hotkeys1 = t([
  t({
    'cmd z': () => {},
    'cmd shift z': () => {},
  }),
  t({
    'space': () => {},
  }, [
    t({
      'delete': () => {},
    })
  ])
])

const hotkeys2 = t([
  t({
    'cmd z': () => {},
  }),
  t({
    'space': () => {},
  })
])

// first lets parse the tree
// then lets think about diffing
// then lets think about making it lazy

const reduce = R.curry((fn, init, tree) => {
  const first = fn(init, tree.value)
  if (tree.children) {
    return tree.children.reduce(reduce(fn), first)
  } else {
    return first
  }
})

const result1 = reduce(R.merge, {}, hotkeys1)
const result2 = reduce(R.merge, {}, hotkeys2)

// now lets make it lazy and return a data structure that saves the result of the computation

const undoable = (canUndo, canRedo) =>
  t(R.merge(
    canUndo ? {'cmd z': () => {}} : {},
    canRedo ? {'cmd shift z': () => {}} : {},
  )),

const songs = () => t({'delete': () => {}})

const itunes = (selected) =>
  t(
    {space: () => {}},
    selected ? [
      thunk(songs),
      t({'x': () => {}}),
    ] : [],
  )

const app = (canUndo, canRedo, selected) =>
  t({}, [
    thunk(undoable, canUndo, canRedo),
    thunk(itunes, selected),
  ])

// if tree is lazy, then we return a {thunk, result}. but if tree isnt lazy
// we return

const zip = R.curry((list1, list2) => {
  const result = []
  const len = Math.min(list1.length, list2.length)
  let idx = 0
  while (idx < len) {
    result[idx] = [list1[idx], list2[idx]]
    idx += 1
  }
  if (list1.length !== list2.length) {
    const max = Math.max(list1.length, list2.length)
    if (idx < list1.length) {
      while (idx < max) {
        result[idx] = [list1[idx], undefined]
        idx += 1
      }
    } else {
      while (idx < max) {
        result[idx] = [undefined, list2[idx]]
        idx += 1
      }
    }
  }
  return result
})


// if there is a previous computation
//   if the node is a thunk and the previous node was a thunk
//     if the thunks are equal then return the previous
//     else the thunks dont equal then evaluate the thunk
//       if this node has children recursively evaluate those nodes and merge their results
//       else this node doesnt have children then the node value is the result
//   else if the node is a thunk and the previous is not a thunk
//     just continue to evaluate the tree the node
//   else if the node isnt a thunk

const lazyReduce = (previous) => R.curry((fn, init, node) => {
  if (previous) {
    if (node.__type === 'thunk') {
      if (previous.thunk && R.equals(node, previous.thunk)) {
        return previous
      } else {
        const tree = node()
        if (tree === previous.tree) {
          return previous
        } else if (tree.children) {
          const children = zip((previous.children || []), tree.children).map(([prev, child]) => {
            return lazyReduce(prev)(fn, init, child)
          })
          const result = children.reduce((acc, child) => fn(acc, child.result), tree.value)
          return {
            thunk: node,
            tree: tree,
            result: result,
            childen: children,
          }
        } else {
          return {
            thunk: node,
            tree: tree,
            result: tree.value,
          }
        }
      }
    } else {
      if (previous.tree === tree) {
        return previous
      } else {
        const children = zip((previous.children || []), tree.children).map(([prev, child]) => {
          return lazyReduce(prev)(fn, init, child)
        })
        const result = children.reduce((acc, child) => fn(acc, child.result), tree.value)
        return {
          thunk: node,
          tree: tree,
          result: result,
          childen: children,
        }
      } else {
        return {
          thunk: node,
          tree: tree,
          result: tree.value,
        }
      }
    }
  } else {
    const firstValue = (tree.__type === 'thunk') ? tree().value : tree.value
    const first = fn(init, firstValue)
    if (tree.children) {
      return tree.children.reduce(lazyReduce(previous)(fn), first)
    } else {
      return first
    }
  }
})
