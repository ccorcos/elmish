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

- time travel high order component
  - import/export/save sequences
  - automatically generate unit tests

- high-order stream for LRU caching (and optional filtering)
- meteor http and subscribe side-effects instead of http

- hot-swap with webpack
- json-diff-patch stateless chatroom example

- elixir composable queries?
- responsive split-view component

- animation state

- user auth
- routing


## Thinking...

We need to start thinking about http as just an update function. asynchronous services should have declarative interfaces.

By lifting the view, update, init functions, we can get time travel for the ui. If we can consider the http service to have a "view" function of greating the data tree from the state then we can lift both of those as well. Then we can merge all time travel instances into one. 

effect is much like view in that it presents an async declarative interface (internet and browser).

it feels like we're going to need data to be involved in some update function so we can easily do undo/redo and time-travel.

The fundamental problem here is how to keep track of effects without spamming http while going back and forth.

THERE NEEDS TO BE A PAUSE/PLAY. if we're blocking effects from being sent...



OK. actually think about this. the debug and the app are separated in a unique way. 


the data and the state of the app get piped to debug which keeps track of the history and a time. the ui can trigger an event to pause play, or change time. 



** 

We have app, debug, and http. Lets make them all work gracefully together.

theres no reason http has to have its own scan. we need to compose these updates!

**





[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992
