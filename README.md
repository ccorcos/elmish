# Elmish

This is a toy project implementing the [Elm architecture][arch] with React and Coffeescript.

To get it running:

    git clone https://github.com/ccorcos/elmish.git
    cd elmish
    npm install
    node server.js
    open http://localhost:3000/

Check out `entry.coffee` to select the example you want to run and work your way through the tutorial.

The Elm archirecture is a very power functional programming pattern for building user interfaces with all kinds of perks. Views are pure funtions of the state of the program. This means you can render any view in any state. So you could create an app of every view in every state making it trivial to re-style your app. You can also record the actions and the state making it easy to implement undo/redo, invalidate latency compensation action, and debug production errors.

## To Do

- move on to giphy example
- debug example

- github example
- socket.io chatroom example
- meteor example with the new



- list of component example
- laziness (?) and immutability
- immutable.js and functionize
- undoable component example
- giphy + http example
- debug example
- github example
- chatroom example




- polish the http service
- concepts of composable queries and fragments as functions
- http caching

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

- listOf
  - how to handle multiple dispatch handlers?
- chatroom example
  - graphql? falcor? express? meteor?

- tutorial examples to js
- time-travel import/export/save sequences

- performance, lazy, memoize

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


## Thinking...

UI components look like this:

init    : () -> state
view    : (dispatch, state, data) -> html
request : (state) -> query
update  : (state, action) -> state

They compose up in the same way you're used to. Effects are just some sort of declarative way of building queries.

Then there are components to handle the data/side-effects. HTTP is an example. It caches data within its state and declaratively passes on effects its still waiting on. This time, effects gets a dispatch method so we can map over it and listen for the results. We need to think of effects just like render. We're declaratively saying what we want and binding event listeners to dispatch the results.

init    : () -> state
update  : (state, action) -> state
effects : (dispatch, state) -> {html, fetch, meteor}

- We need to think about better names. For UI stuff, we can think about request, query, and data all together, very much in the UI realm. In a more general sense, once we've dealt with composing the requests, we can think of rendering html, fetching, subscribing, all as side-effects and different services that declaratively parse the data structure and asynchronously trigger event listeners.

- the debug component can simply filter the effects and actions for pause/play and remember the states.


maybe we ought to do this one first, maybe just with gihpy
init    : () -> state
update  : (state, action) -> state
effects : (dispatch, state) -> {html, fetch, meteor}

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

We can create similar structures for other services as well.

- Hotkeys
- HTTP
- Meteor

[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992
