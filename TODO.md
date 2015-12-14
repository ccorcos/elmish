
## To Do

- github example
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
