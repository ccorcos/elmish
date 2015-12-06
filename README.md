# Elmish

This is a toy project implementing the [Elm architecture][arch] with React and Coffeescript.

To get it running:

    git clone https://github.com/ccorcos/elmish.git
    cd elmish
    npm install
    node server.js
    open http://localhost:3000/

Check out `entry.coffee` to select the example you want to run.

The Elm archirecture is a very power functional programming pattern for building user interfaces with all kinds of perks. Views are pure funtions of the state of the program. This means you can render any view in any state. So you could create an app of every view in every state making it trivial to re-style your app. You can also record the actions and the state making it easy to implement undo/redo, invalidate latency compensation action, and debug production errors.

## To Do

- high-order stream for LRU caching (and optional filtering)
- meteor http and subscribe side-effects instead of http
- time travel high order component
  - import/export/save sequences
  - automatically generate unit tests
- hot-swap with webpack
- json-diff-patch stateless chatroom example

- elixir composable queries?
- responsive split-view component

- animation state

- user auth
- routing

[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992
