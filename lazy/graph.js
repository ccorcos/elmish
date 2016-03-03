// the goal here is to create a generic graph data structure / lazy graph implementation
// we should be able to use this to:
// - build a vdom tree (and convert to react)
// - build a graphql tree
// - build a normalized cache
// - parse queries into a normalized form
// - ...and much more!

NODE = "@@graph_node"
LINK = "@@graph_link"

node = {type:'something', props:{}, children: [], [NODE]: true}

// a leaf node can simply be a value. but for intermediary nodes
// if you want to have an associated value, you need to put that
// props.

node = g('something', {}, [])
node = g('something', [])
node = g('something')

// we can build trees this way, but what about when we want a graph?
// we can create a graph with links.

link = {}



// WITHOUT NAMED CHILDREN, WE CANT SPECIFY PROPER PATHS!
// react does exactly have this issue because they arent specifying paths.
//

// we need...
// - values as leaf nodes
//   that way the cache/index can be a graph as well!
// - to handle abritrary "names"
//   that way we can pass components into the name for react hyperscript
// - handle arbirary children as an array
//   so we can be compatible with react
// - simple function for quering the path


// todo -- we need to think about what graphs we want to represent and how those
// get represented. we need to think ong and hard about it

// graphs we want to represent
// - a graphql query tree
// - graph data in normalized fashion
// - vdom tree (compatible with react)
// if we cover these, I think we'll be golden.

graphql = `{
  chatrooms {
    id,
    name
  },
  messages(room/id: 0) {
    id,
    text,
    author { id, name },
    room { id }
  }
}`

// here's how we might express it
g('root', [
  g('chatrooms', ['id', 'name']),
  g('messages', {'room_id', 0}, [
    'id', 'text',
    g('author', ['id', 'name']),
    g('room', ['id'])
  ])
])

// so nodes have a name, some properties/value, and children.
// a node can also simply be a value.

// QUESTION: are props necessarily and object? are children ever a list and not named?

// in react, this is a valid tree:

g('div.class', {style:{display:'none'}}, [
  g('span', 'hello'),
  g('span', {}, 'chet'),
  g('span', ['you', 'are', 25])
])

// QUESTION: how does React represent this graph? What happened when you map over something
// vs what happens when you have structural repetition like we have here?

// in react, children is a prop!

// children are kept in an array. using keys only makes the diff more efficient especally with large arrays
// using R.equals, we can do the deep comparison and using thunks, limit the depth we need to go to!


// according to react
// - children can be another node, list of nodes, or a value
// - {type, key, props: {children, ...}}

// according to graphql
// - children are all named in an object
// - chidren can't be values, only empty objects
// - {fields: {name: {params, fields: { ... }}}}

// type = name
// params = props
// fields = children

// so this is inevitably a little messy here. we could just use our own
// hyperscript helpers for each I suppose, theres nothing wrong with that
// i suppose. I was really hoping for some universal format. But at least
// we've come up with a universal way of building these things!

// so maybe out database/cache could be constructed similarly to the graphql thing.
// at the end of the day we need to come up with our own custom schemes for what the
// hyperscript translates to.

