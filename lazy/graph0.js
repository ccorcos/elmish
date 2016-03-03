// the goal here is to create a generic graph data structure / lazy graph implementation
// we should be able to use this to:
// - build a vdom tree (and convert to react)
// - build a graphql tree
// - build a normalized cache
// - parse queries into a normalized form
// - ...and much more!

// first lets define a tree first
nodes = {[name]: {props:{}, children: {nodes}}}

// we can create a node with hyperscript syntax
node = g('string', {}, [])
node = g('string', [])
node = g('string')

// now the crucial thing to note here is that all descendants
// are named. this means that this graph hyperscript is slightly
// different from react hyperscript as you will see.

// at the end of a day, a tree can be defined like this:

tree = g([
  g('node1', {a: 1}, [
    g('child1', {b: 2})
  ]),
  g('node2', [
    g('child2'),
    g('child3', [
      'child4',
      'child5'
    ])
  ])
])

// and the resulting tree will look like:
tree = {
  node1: {
    props: {a: 1},
    children: {
      child1: {
        props: {b: 2}
      }
    }
  },
  node2: {
    children: {
      child2: {},
      child3: {
        children: {
          child4: {},
          child5: {}
        }
      }
    }
  }
}

// so now lets write some code to build this graph hyperscript helper
function g(name, props, children) {
  // handle identity
  // g(g('x')) = g('x')
  if (is.hash(name)) {
    return name
  }
  // if we just get a string
  // g('x') = {x: {}}
  if (is.string(name) && !props && !children) {
    return {[name]: {}}
  }
  // if we just get children then merge them
  // g([g('x'), g('y')]) = {x: {}, y: {}}
  if (is.array(name)) {
    return R.pipe(R.map(g), R.mergeAll)(g)
  }
  // if we pass children and no props
  // g('x', [g('y')]) = {x: {children: {y: {}}}}
  if (is.string(name) && is.array(props)) {
    return {[name]: {children: g(props)}}
    }
  }
  // if we pass props and no children
  // g('x', {a: 1}) = {x: {props: {a: 1}}}
  if (is.string(name) && is.hash(props) && !children) {
    return {[name]: {props}}
  }
  // if we pass props and children
  // g('x', {a: 1}, ['y', 'z']) = {x: {props: {a: 1}, children: {y: {}, z: {}}}}
  if (is.string(name) && is.hash(props) && is.array(children)) {
    return {[name]: {props, children: g(children)}}
  }
  throw new Error('invalid graph hyperscript format')
}

// so who cares about this stuff? Well, lets take a look at a graphql query:
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

// why not just use graph hyperscript?
graphql = q([
  q('chatrooms', ['id', 'name']),
  q('messages', {'room_id': 0}, [
    'id',
    'text',
    q('author', ['id', 'name']),
    q('room', ['id'])
  ]),
])

// ok, so thats cool, but we're just making trees; I thought this was *graph* hyperscript!
// so lets define a graphql schema -- not thats definitely a graph. we can do this by 
// creating special props for identities. an identity specifies the entity type and what 
// property to index that entity on.
schema = q([
  g('chatroom', [
    'id',
    'name',
    g('messages', {
      identity: {
        entity: 'message',
        index: 'id'
      }
    }),
  ]),
  g('message', [
    'id',
    'text',
    g('author', {
      identity: {
        entity: 'user',
        index: 'name'
      }
    }),
    g('chatroom', {
      identity: {
        entity: 'chatroom',
        index: 'id'
      }
    })
  ]),
  g('user', [
    'id',
    'name'
  ])
])

// thats pretty cool. now we can use this schema for normalizing data and querying data.
// suppose we're stuck with some legacy api and theres some api that returns a bunch of
// unnormalized data. we can define a schema for the return value and parse it accordingly
// into a normalized form.

api = {
  chatrooms: {
    fetch: () => [
      {id: 0, name: 'meteor', messages: [{id: 0, text: 'meteor.js is cool!', author: {id: 0, name: 'Chet'}},
                                         {id: 1, text: 'yeah, I just check out meteor the other day', author: {id: 1, name: 'Jan'}},
                                         {id: 2, text: 'cool! what did you think of it?', author: {id: 0, name: 'Chet'}}]},
      {id: 1, name: 'javascript', messages: [{id: 3, text: 'hey have you heard of meteor yet?', author: {id: 0, name: 'Chet'}},
                                             {id: 4, text: 'no, whats it about?', author: {id: 2, name: 'Brett'},
                                             {id: 5, text: 'check it out in the other room', author: {id: 0, name: 'Chet'}}]},
      {id: 2, name: 'clojure', messages: []},
      {id: 3, name: 'haskell', messages: []},
      {id: 4, name: 'elm', messages: []},
      {id: 5, name: 'om next', messages: []},
      {id: 6, name: 'node.js', messages: []},
      {id: 7, name: 'react', messages: []},
      {id: 8, name: 'graphql', messages: []},
    ],
    schema: () => g('$array', [
      schema.chatroom
    ])
  }
}

// we can use special nodes in the graph to specify arrays and hashes (objects) so we can
// parse out the data properly. after parsing just the first message, we could build a
// flattened, serializable index that is itself a graph!

index = g([
  g('message', [
    g('id', [
      g('0', {
        v
      })
    ])
  ])
])

flattened = {
  $index: {
    message: {
      id: {
        0: {
          id: 0,
          text: "meteor.js is cool!",
          author: {
            $link: ['user', 'name', 'Chet']
          },
          chatroom: {
            $link: ['chatroom', 'id', 0]
          }
        }
        /* ... etc ... */
      }
    },
    chatroom: {
      id: {
        0: {
          id: 0,
          name: 'meteor',
          messages: [
            {$link: ['message', 'id', 0]},
            /* ... etc ... */
          ]
        }
      }
    },
    user: {
      name: {
        Chet: {
          id: 0,
          name: 'Chet'
        }
        /* ... etc ... */
      }
    },
  },
  chatrooms: [
    {$link: ['chatroom', 'id', 0]},
    /* ... etc ... */
  ]
}

// we can use the {$link}




// We need to start over again. We should be able to have just plain old values as
// leafs of the graph. This is much like react hyperscript already. That means we
// should have a special $type: node property on objects which define something 
// as a node. Otherwise its a leaf, and therefore its just a value.

// we need...
// - values as leaf nodes
//   that way the cache/index can be a graph as well!
// - to handle abritrary "names"
//   that way we can pass components into the name for react hyperscript
// - handle arbirary children as an array
//   so we can be compatible with react 
// - simply function for quering the path