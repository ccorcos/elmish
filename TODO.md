
## To Do

- outline the goals of elmish
  - abstraction
  - purity
  - state should be serializable
  - time travel

- graphql hacker news
- github with a caching layer
- simple chatroom
- awesome responsive splitview
- routing
- meteor
- performance, lazy evaluation without instantiating objects?

- github http caching layer
- graphql + hacker news, but no relay.
- try to implement some basic caching with graphql
- performance - wrap in a React class for lazy evaluation
- chatroom example with dynamodb
  - pub-sub?
  - fatquery
  - latency compensation

- hacker news graphql/relay example with graphqlhub.com
  https://medium.com/@clayallsopp/relay-101-building-a-hacker-news-client-bb8b2bdc76e6#.a7rwoalft

  - just use graphql and function composition
  - then think about caching, mutations, fat queries, etc.

- performance
  - lazily evaluation by wrapping in a react component with shouldComponentUpdate and pass it all the way through.

- install aws dyanamodb locally and get it running with node express.

- think about a chatroom schema and define one with graphql
  https://learngraphql.com/

  - think about more complicated schemas as well
    - localized chat
    - tinder
    - uber

  - what about titan and follower/following recommendation/search schemas
    - instagram
    - findashindig.com
    - reddit

  - how does reactivity work without db pub/sub?
  - how does reactivity work with pub-sub?
  http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html

- how does relay work
  - how does relay do caching and latency compensation?
  - can I extract that into pure functions?

- how does authentication work?

---

- chatroom with graphql and websockets
- meteor chatroom example
- relative import paths?
- chatroom with graphql and auth and aws

- chatroom example
- socket.io chatroom example
- meteor example with the new module system

- laziness (?) and immutability
- immutable.js and functionize

- oauth service
- passport.io service?
- chatroom with graphql


- GraphQL
  - create schema without "this" or "new"
    - https://github.com/devknoll/graphql-schema
    - https://github.com/matthewmueller/graph.ql
  - use JSON query instead of stings
    - https://github.com/ooflorent/babel-plugin-graphql
  - client cache?
    - read cache sync and rest async?
  - mutations
    - latency compensation
    - reactivity
  - backend? database? websockets?

- github explorer project
  - isomorphic
  - graphql
  - oauth
  - stateless and pure UI
    - navvc
    - tabvc
    - splitvc
    - search
    - hotkeys
    - routing
    - animation
  - time-travel
  - generate tests
  - save sequences

- chatroom project
  - custom auth or passport.io
  - socket.io or elixir
  - mongo or redis


- time-travel import/export/save sequences

- meteor http side-effect
- meteor subscribe side-effect
- socket.io subscribe side-effect
- phoenix subscribe side-effect

- json-diff-patch stateless chatroom example

- elixir composable queries?

- responsive split-view component
- animation state
- user auth
- routing

## Notes

React has a basic JSON declarative tree:

{
  type: 'div',
  props: {
    className: 'user-item'
    onClick: (e) => this.setState({selected: user.id})
  }
  children: [{
    type: 'span'
    props: {}
    children: [user.id]
  }]
}

When we build our user interface, we're just patching these trees together.

GraphQL has a basic declarative JSON tree as well:

{
  fields: {
    followers: {
      params: {
        userId: user.id
      },
      fields: {
        name: {},
        posts: {
          params: {
            limit: 20
          },
          fields: {
            count: {},
            edges: {
              ?? https://github.com/ooflorent/babel-plugin-graphql
            }
          }
        }
      }
    }
  }
}

GraphQL gets patched together by.... Relay, fragments...?



# HMR



// check if HMR is enabled
if (module.hot) {
  // accept update of dependency
  module.hot.accept(["src/giphy", "src/debug"], () => {
    // save the previous state of the application
    const state = state$()
    // stop all side-effects
    handler.end(true)
    // import the latest versions
    let app = require('src/giphy').default
    let debug = require('src/debug').default
    // override init
    const {effects, update} = debug(app)
    const init = () => state
    // mutate and restart side-effects
    const result = start({init, effects, update})
    effect$ = result.effect$
    state$ = result.state$
    handler = flyd.map(({html, http}) => {
      render(html)
      fetch(http)
    }, effect$)
  });
}
