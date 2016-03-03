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
