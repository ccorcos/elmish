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

// there seems to be a difference between a diff-reduce and a diff-patch. diff reduce will
// reduce over the values producing some new result. this is great for publish and hotkeys
// but so useful when it comes to virtual dom or... something along those lines. i dont actually
// have a compelling example yet. websocket channels or anythere where you want to dedupe
// will use diff-reduce. diff-patch is really only useful for vdom I suppose... even graphql
// is going to involve deduping and then doing a separate diff... in the end, this is a
// lazy reduce, not a diff!

// we can definitely refactor out a lot of this logic around what is a thunk and how we save
// all the data in the previous object. this can all be generalized to work for anyone's
// problem :)

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

// computation :: {thunk?, node, result, children?}
// node :: {value, children?}
// if a node has no children then result is the node value. otherwise its the
// reduction of applying fn over the all the child node results and the node value.
const lazyReduce = R.curry((fn, prev, next) => {
  if (prev) {
    if (isThunk(next)) {
      const thunk = next
      if (compHasThunk(prev) && thunkEquals(thunk, compGetThunk(prev))) {
        return prev
      } else {
        const node = runThunk(thunk)
        if (node === compGetNode(prev)) {
          return prev
        } else if (hasChildren(node)) {
          const children = zip(
            compGetChildren(prev) || [],
            getChildren(node),
          ).map(([p, c]) =>
            lazyReduce(fn, p, c)
          )
          const result = children.reduce((acc, child) => fn(acc, compGetResult(child)), getValue(node))
          return computation({
            thunk: thunk,
            node: node,
            result: result,
            childen: children,
          })
        } else {
          return computation({
            thunk: thunk,
            node: node,
            result: getValue(node),
          })
        }
      }
    } else {
      const node = next
      if (compGetNode(prev) === node) {
        return prev
      } else {
        if (hasChildren(node)) {
          const children = zip(
            compGetChildren(prev) || [],
            getChildren(node),
          ).map(([p, c]) =>
            lazyReduce(fn, p, c)
          )
          const result = children.reduce((acc, child) => fn(acc, compGetResult(child)), getValue(node))
          return computation({
            node: node,
            result: result,
            childen: children,
          })
        } else {
          return computation({
            node: node,
            result: getValue(node),
          })
        }
      }
    }
  } else {
    if (isThunk(next)) {
      const thunk = next
      const node = runThunk(thunk)
      if (hasChildren(node)) {
        const children = getChildren(node).map(c => lazyReduce(fn, undefined, c))
        const result = children.reduce((acc, child) => fn(acc, compGetResult(child)), getValue(node))
        return computation({
          thunk,
          node,
          result,
          children
        })
      } else {
        const result = getValue(result)
        return computation({
          thunk,
          node,
          result,
        })
      }
    } else {
      const node = next
      if (hasChildren(node)) {
        const children = getChildren(node).map(c => lazyReduce(fn, undefined, c))
        const result = children.reduce((acc, child) => fn(acc, compGetResult(child)), getValue(node))
        return computation({
          node,
          result,
          children
        })
      } else {
        const result = getValue(result)
        return computation({
          node,
          result,
        })
      }
    }
  }
})

// TODO: refactor some more. its pretty ugly and not reusing enough. dont need to be
// quite so generic either but may as well.
// make some test that demonstrate that this function works
