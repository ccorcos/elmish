# Elmish

This is functional programming pattern inspired by the [Elm Architecture][arch] for building user interfaces.

To get it running:

```sh
git clone https://github.com/ccorcos/elmish.git
cd elmish
npm install
ln -s .. node_modules/elmish
node server.js
open http://localhost:3000/
```

Check out `entry.js` to select the example you want to run and work your way through the tutorial.

## Goals

- **Abstraction**
  - It should be trivial to reuse UI components without rewriting them.
  - You should be able to create N instances of your app side-by-side without iframes.
  - Virtual DOM and data fetching requests ought to composable.
- **Pure, Stateless, and Declarative**
  - The UI should be a pure function of state.
  - There should be no side-effects tied to the render cycle.
  - Declare what your want, not how to do it.
  - No global variables.
- **Serializable States and Actions**
  - Trivial event tracking
  - Send states and actions to the server on any runtime exceptions.
  - Record user sessions and run predictive testing.
  - Time-travelling debugger.
  - Record and save flows to different corners of the app.
  - Generative testing by using the app.

## Current Challenges

These challenges are not roadblocks, but still need to be sorted out and implemented.

- **Performance**
  - There needs to be a convenient way to memoize the declare functions to minimize recomuputing the same UI components with the same state.
  - Immutable.js to take care of any garbage trashing problems.
- **Data Caching**
  - There needs to be a way to hydrate a UI with cached data synchronously.
  - Should caching be taken care of in the core logic or as part of a service?
- **Sharing Code**
  - Is there a standard webpack configuration for sharing code, UI components, and static assets?
- **Static Declarations**
  - GraphQL fragments do not need to be returned from `declare` but ought to be kept separate.

[arch]: https://github.com/evancz/elm-architecture-tutorial
