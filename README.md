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

## Implementation Notes

To get concurrency to work, Elm uses Tasks, Effects, and ports. In JavaScript, promises accomplish this for us and they run immediatly without having to find their way to a port. Thus we simply pass the `effect$` stream to init and update so they can send promises along easily.

Elm has a sweet Signals package, but lucky, we have [flyd](https://github.com/paldepind/flyd).

[Ramda](http://ramdajs.com/) also keeps the code clean and functional.

## To Do

- declarative data requests
  - http
    - github
  - websockets
    - chatroom
- animation with requestAnimationFrame
- hot module replacement
- time travelling debugger
- datomic and datascript

- user auth
- routing
- view controllers

[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992
