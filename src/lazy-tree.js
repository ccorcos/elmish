// The Lazy Tree Problem

// Lets start with regular old tree:

// Here's a tree:
const tree = Node({count: 1}, [
  Node({count: 2}),
  Node({count: 3}, [
    Node({count: 4}),
    Node({count: 5}),
  ]),
])

// We can map over all the node values:
tree.map(evolve({count: inc}))
// => Node({count: 2}, [
//   Node({count: 3}),
//   Node({count: 4}, [
//     Node({count: 5}),
//     Node({count: 6}),
//   ]),
// ])

// We can reduce all the node values:
tree.reduce(sum, 0)
// => Node({count: 15})

// Now lets introduce some laziness:
const tree = LazyNode(x => Node({count: x}, [
  Node({count: x + 1}),
  LazyNode(y => Node({count: y}, [
    Node({count: y + 1}),
    Node({count: y + 2}),
  ]), x + 2),
]), 1)

// This is an equivalent tree as before (same computed values) except now we
// have lazy nodes to break up the computation. When we transform a lazy tree,
// the transformations are themselves lazy:

tree.map(evolve({count: inc}))
// => LazyNode(
//   compose(
//     n => n.map(evolve({count: inc}),
//     x => Node({count: x}, [
//       Node({count: x + 1}),
//       LazyNode(y => Node({count: y}, [
//         Node({count: y + 1}),
//         Node({count: y + 2}),
//       ]), x + 2),
//     ])
//   ),
//   1
// )

tree.reduce(sum, 0)
// => LazyNode(
//   compose(
//     n => n.reduce(sum, 0),
//     x => Node({count: x}, [
//       Node({count: x + 1}),
//       LazyNode(y => Node({count: y}, [
//         Node({count: y + 1}),
//         Node({count: y + 2}),
//       ]), x + 2),
//     ])
//   ),
//   1
// )

// We can evaluate this tree to get a strict (non-lazy) version back. But to
// save some CPU cycles, we can keep track of an isomorphic tree that remembers
// the previous computation so we can compare LazyNodes and only re-evaluate
// the lazy nodes that have changed. To do this, we'll create a new type.

const computation = Computation(tree)
computation.value()
// => Node({count: 1}, [
//   Node({count: 2}),
//   Node({count: 3}, [
//     Node({count: 4}),
//     Node({count: 5}),
//   ]),
// ])

const computation = Computation(tree.map(evolve({count: inc})))
computation.value()
// => Node({count: 2}, [
//   Node({count: 3}),
//   Node({count: 4}, [
//     Node({count: 5}),
//     Node({count: 6}),
//   ]),
// ])

const computation = Computation(tree.reduce(sum, 0))
computation.value()
// => Node({count: 15})

// The point of this is that we should be able to recompute trees while
// performing a minimal amount of work. For example, here's the tree we've
// been looking at this whole time:

const tree1 = LazyNode(x => Node({count: x}, [
  Node({count: x + 1}),
  LazyNode(y => Node({count: y}, [
    Node({count: y + 1}),
    Node({count: y + 2}),
  ]), x + 2),
]), 1)

// And here's another tree that's changed a little bit:

const tree2 = LazyNode(x => Node({count: x}, [
  Node({count: x + 1}),
  LazyNode(y => Node({count: y}, [
    Node({count: y + 1}),
    Node({count: y + 2}),
  ]), x + 1), // changed this
]), 2) // changed this

// The important thing to realize above is that the inner lazy tree is the same
// as before. So when we compute the reduction of tree1, we'll have to traverse
// the entire tree. But when we reuse the previous computation to compute the
// same reduction of tree2, we shouldn't have to traverse the entire tree again
// because that inner LazyNode is equivalent:

const computation1 = Computation(tree1.reduce(sum, 0))
computation1.value()
// => Node({count: 15})

const computation2 = Computation(tree2.reduce(sum, 0), computation1)
computation2.value()
// => Node({count: 17})

// And now the million dollar question: how do we do this?! lol.

// Conceptually, it's not too hard to figure out how you'd do this with map
// because map returns an isomorphic tree. Here is the example from above:

// tree.map(evolve({count: inc}))
LazyNode(
  compose(
    n => n.map(evolve({count: inc}),
    x => Node({count: x}, [
      Node({count: x + 1}),
      LazyNode(y => Node({count: y}, [
        Node({count: y + 1}),
        Node({count: y + 2}),
      ]), x + 2),
    ])
  ),
  1
)

// We can check to see if the top-level lazy node is equivalent to the previous
// computation, and if it isn't we can start to recursively evaluate, pushing
// the map down through all the children:

Node({count: 2}, [
  Node({count: 3}),
  LazyNode(
    compose(
      n => n.map(evolve({count: inc}),
      y => Node({count: y}, [
        Node({count: y + 1}),
        Node({count: y + 2}),
      ])
    ),
    4
  ),
])

// At every LazyNode you simply need to remember the node and the result of
// evaluating it so you can zip it up against a new tree and compare them for
// the nest time.

// Where this begins to get much trickier is when we reduce the tree because
// reduce requires evaluating all of the children in order to aggregate all
// all of the values. That is, we can't just take one recursive step like we
// did with map and return an isomorphic tree.

// For example:

// tree.reduce(sum, 0)
LazyNode(
  compose(
    n => n.reduce(sum, 0),
    x => Node({count: x}, [
      Node({count: x + 1}),
      LazyNode(y => Node({count: y}, [
        Node({count: y + 1}),
        Node({count: y + 2}),
      ]), x + 2),
    ])
  ),
  1
)

// If the top-level LazyNode isn't equivalent, then we'll recursively evaluate
// deeper:

Node({count: 1}, [
  Node({count: 2}),
  LazyNode(
    compose(
      n => n.reduce(sum, 0),
      y => Node({count: y}, [
        Node({count: y + 1}),
        Node({count: y + 2}),
      ])
    )
    x + 2
  ),
])

// Only that's not actually reducing anything!

// So this is pretty much where I'm stuck. And this only gets more challenging
// when you want to chain these transformations together:

tree.filter(/*...*/).map(/*...*/).reduce(/*...*/).map(/*...*/)
