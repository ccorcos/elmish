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

[arch]: https://github.com/evancz/elm-architecture-tutorial
