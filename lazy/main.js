import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import flyd from 'flyd'
import is from 'is-js'

const f = (fn, ...args) => {
  let _fn = (...more) => {
    return R.apply(fn, R.concat(args, more))
  }
  _fn.fn = fn
  _fn.args = args
  _fn.equals = (fn2) => {
    return R.equals(fn2.fn, _fn.fn) &&
           R.equals(fn2.args, _fn.args)
  }
  return _fn
}

const LazyReact = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    return !R.equals(this.props, nextProps) ||
           !R.equals(this.state, nextState)
  },
  render() {
    return R.apply(this.props.view, this.props.args)
  }
})

const hf = (view, ...args) => {
  return h(LazyReact, {view, args})
}


const forward = (dispatch, id, action) => {
  dispatch({type: 'forward', id, action})
}
const action = (dispatch, type, id) => {
  dispatch({type, id})
}

const propNeq = R.compose(R.complement, R.propEq)

// chatroom

// so here's a graphql string. pretty cool syntax
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

// but lets make it something more useful to play around with:
graphql = {
  chatrooms: {
    children: {
      id: {},
      name: {}
    }
  },
  messages: {
    props: {'room/id': 0},
    children: {
      id: {},
      text: {},
      author:  {
        children: {
          id: {},
          name: {}
        }
      },
      room: {
        id: {}
      }
    }
  }
}

// clever. use props and children just like react ;) now we can use
// my favorite react hyperscript syntax!

// function q(name, props, children) {
//   return {
//     [name]: {
//       props,
//       children: R.mergeAll(children)
//     }
//   }
// }

// q('chatrooms', {}, [
//   q('id'),
//   q('name')
// ])

// q('messages', {'room/id': 0}, [
//   q('id'),
//   q('text'),
//   q('author', {}, [
//     q('id'),
//     q('name')
//   ]),
//   q('room', {}, [
//     q('id')
//   ])
// ])


function q(name, props, children) {
  // handle identity
  if (is.hash(name)) {
    return name
  }
  // if we just get a string
  if (is.string(name) && !props && !children) {
    return {[name]: {}}
  }
  // if we just get children then merge them
  if (is.array(name)) {
    return R.pipe(R.map(q), R.mergeAll)(q)
  }
  // if we pass children and no props
  if (is.string(name) && is.array(props)) {
    return {[name]: {children: q(props)}}
    }
  }
  // if we pass props and no children
  if (is.string(name) && is.hash(props) && !children) {
    return {[name]: {props}}
  }
  // if we pass props and children
  if (is.string(name) && is.hash(props) && is.array(children)) {
    return {[name]: {props, children: q(children)}}
  }
  throw new Error('invalid hyperscript query format for q')
}

// cool, now we have a much more slick syntax more like hyperscipt
graphql = q([
  q('chatrooms', ['id', 'name']),
  q('messages', {'room_id': 0}, [
    'id',
    'text',
    q('author', ['id', 'name']),
    q('room', ['id'])
  ]),
])

// now we need to define some kind of schema

// heres some raw data for some kind of chat service. its not in any special format.
// the data isnt exactly normalized but it does have some references to things.
data = {
  'chatrooms': [
    {id: 0, name: 'meteor'},
    {id: 1, name: 'javascript'},
    {id: 2, name: 'clojure'},
    {id: 3, name: 'haskell'},
    {id: 4, name: 'elm'},
    {id: 5, name: 'om next'},
    {id: 6, name: 'node.js'},
    {id: 7, name: 'react'},
    {id: 8, name: 'graphql'},
  ],
  'messages': [
    {id: 0, text: 'meteor.js is cool!', 'author_id': 0, 'room_id':0},
    {id: 1, text: 'yeah, I just check out meteor the other day', 'author_id': 1, 'room_id':0},
    {id: 2, text: 'cool! what did you think of it?', 'author_id': 0, 'room_id':0},
    {id: 3, text: 'hey have you heard of meteor yet?', 'author_id': 0, 'room_id':1},
    {id: 4, text: 'no, whats it about?', 'author_id': 2, 'room_id':1},
    {id: 5, text: 'check it out in the other room', 'author_id': 0, 'room_id':1},
  ],
  'users': [
    {id: 0, name: 'Chet'},
    {id: 1, name: 'Jan'},
    {id: 2, name: 'Brett'}
  ]
}

// lets see if we can parse this data into a normalized format and then try to run
// some graphql queries on it.

// schema is also a tree structure and we can build it with hyperscript.

schema = {
  chatroom: {
    props: {},
    children: {
      id: {},
      name: {},
      messages : {
        props: {
          join: {
            this: 'id',
            those: ['message', 'chatroom_id']
          }
        },
      },
      top_user: {
        props: {
          aggregate: {
            the: 'id', // or these if multiple things are returned
            that: 'user/id',
            aggregate: (args) => {
              // so we could use datalog or something liek that,
              // but we could just specify how to grab the data here.
              // im curious how we could be clever with this on the client.
            }
          }
        }
      }
    }
  },
  message: {
    props: {},
    children: {
      id: {},
      text: {},
      author_id: {},
      chatroom_id: {},
      author: {
        props: {
          join: {
            this: 'author_id',
            that: 'user/id'
          }
        }
      },
      chatroom: {
        props: {
          join: {
            this: 'chatroom_id',
            that: ['chatroom', 'id']
          }
        }
      }
    }
  }
}

// so that was a rabbit hole. some things to think about moving forward:
// what happens when we use highly unnormalized input. what if we get
// all chatrooms with all messages and all users entirely unnormalized?
// then how do we normalize that? and how do we query to get the exact
// unnormalized version of it back? can we also find a way to only transport
// normalized data and build it on the client?

// what shuold we do about joins? what should we do about aggregations?
// what should we do about queries with specific args?
// we can stringify args and use them as keys to save the results uniquely
// its starting to seem liek we dont even need to define a schema, much
// like datomic, this all just happens with datalog queries...

// 1. make some data highly unnormalized
// 2. normalize it
// 3. re-unnormalize it with a query
// 4. extract transportable normalized data for query

// we can just use hyperscript for everything here!
// XXX TODO at some point thie needs to handle thungks all togther
// and we can parse it out into react!
const s = q

// here, we're defining a graph via defining a tree with identity functions that
// are paths through the tree all over again. when parsing through this graph, 
// its important that we only ever lazily evaluate paths and properties because
// there can definitely be circular dependencies like people who are friends with
// each other.
schema = s([
  s('chatroom', [
    'id',
    'name',
    s('messages', {
      // this is a message, indexed by id, with the following id.
      // we're defining a path in the normalized cache
      identity: ({id}) => ['message', 'id', id]
    }),
  ]),
  s('message', [
    'id',
    'text',
    s('author', {
      // lets index users by name just for fun
      identity: ({name}) => ['user', 'name', name]
    }),
    s('chatroom', {
      identity: ({id}) => ['chatroom', 'id', id]
    })
  ]),
  s('user', [
    'id',
    'name'
  ])
])

// here is some highly unnormalized data
data = [
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
]

// we should be able to define data sources along with their types, so that we can get data from an 
// existing api into our caching system.

external = {
  chatrooms: {
    fetch: () => {data},
    // we define the schema as a tree as well so we know how
    // to parse the data into the cache. we use the special '$hash' and '$array' for
    // using the graph schema to destructure the query properly, and then we can directly
    // reference the schema for each type!
    schema: () => g('$hash', [
      g('data', [
        g('$array', [
          schema.chatroom
        ])
      ])
    ])
  },
  user: {
    fetch: (id) => ({data: {users: {[id]:{0: {id: 0, name: 'Chet'}, 1: {id: 1, name: 'Jan'}, 2: {id: 2, name: 'Brett'}}[id]}}})
    // maybe we can come up with a $hash with a path shortand because this is ugly, but
    // its possible that you want to use different keys for different things, so lets be more 
    // generic this way.
    schema: () => g('$hash', [
      g('data', [
        g('$hash', [
          g('users', [
            g('$hash', [
              g(id, [
                scehma.user
              ])
            ])
          ])
        ])
      ])
    ])
  }
}

// so this is really cool. before moving forward though, we need to think about one thing. we're requiring
// all edges of the graph to be names without naming collisions. this means that this graph format is not
// compatible with react-hyperscript because there may be multiple children and those children may have 
// the same node name, such as multiple h('span') or h('div') elements. react solves this by requiring a key
// prop when the elements are not positionally placed so we can do an efficient diff of the graph.






// there should be normalized data and flattened data. normalized has links
// going both way, and flattened is just the minimal amount of info

// flattened after parsing the just the first message
flattened_data = {
  "message/id": {
    0: {id: 0, text: "meteor.js is cool!", author_id: 0, room_id: 0},
  },
  "room/id": {
    0: {id: 0, name: 'meteor'},
  },
  "author/id": {
    0: {id: 0, name: 'Chet'}
  }
}


// so we have a schema. we need to be able to define a request and schema of the returned values of that request





function flatten(schema, data) => {

}









function normalize(schema, data_type, data) {
  // walk to data along with the data type
  // when you get to a join, then normalize
  // an array also is an implicit join of sorts where you need to normalize automatically

  // we want to check that things are the same type
  // can a property value be an array? ...
  check(is.array(data.type) === is.array(data_type.type))
  if (is.array(data.type)) {

  }
}











// now we shuld be able to use a graphql query system along with the schema to normalize this data.
data_type = [q('chatroom', [
  'id',
  'name',
  q('messages', [
    'id',
    'text',
    q('author', [
      'id',
      'name'
    ])
  ])
])]



const counter = {
  init: () => 0,
  update: (state, action) => state + action,
  view: (dispatch, state) => {
    console.log('counter', state)
    const inc = f(dispatch, +1)
    const dec = f(dispatch, -1)
    return h('div.counter', [
      h('button.dec', {onClick:dec}, '-'),
      h('span.count', state),
      h('button.inc', {onClick:inc}, '+'),
    ])
  }
}


const listOf = (kind) => {
  return {
    init: () => ({list: [], nextId: 0}),
    update: (state, action) => {
      switch (action.type) {
        case 'insert':
          const item = {
            id: state.nextId,
            state: kind.init()
          }
          return R.evolve({
            list: R.append(item),
            nextId: R.inc
          }, state)
        case 'remove':
          return R.evolve({
            list: R.filter(propNeq('id', action.id))
          }, state)
        case 'forward':
          const idx = R.findIndex(R.propEq('id', action.id), state.list)
          return R.evolve({
            list: R.adjust(R.evolve({
              state: (state) => kind.update(state, action.action)
            }), idx)
          }, state)
        default:
          console.warn("Unknown action:", action)
          return state
      }
    },
    view: (dispatch, state) => {
      const insert = f(dispatch, {type: 'insert'})
      return h('div.list-of', [
        h('button.insert', {onClick: insert}, '+'),
        state.list.map((item, i) => {
          return (
            h('div.item', {key:item.id}, [
              hf(kind.view, f(forward, dispatch, item.id), item.state),
              h('button.remove', {onClick: f(action, dispatch, 'remove', item.id)}, 'x')
            ])
          )
        })
      ])
    }
  }
}

const start = (app) => {
  const root = document.getElementById('root')
  const action$ = flyd.stream()
  const state$ = flyd.scan(app.update, app.init(), action$)
  const html$ = flyd.map(f(app.view, action$), state$)
  const render = html => ReactDOM.render(html, root)
  flyd.on(render, html$)
}

start(listOf(counter))

// every side-effect / component needs to have some kind of algebraic structure
// that we can play with. for example, vdom has a .bind or just a constructor to
// put a value inside of it. they also have a concat to put them side by side.
// http requests have a concat to put them together which should also reduce
// any duplicates at the same time. hotkeys should concat with some degree of
// precedence. graphql has a .bind. idk if it should be called bind or compose.
// but the point is, we need to bake in these algebraic meanings so we can get
// better abstraction.
