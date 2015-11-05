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

- rather than return an action with the whole payload, return an action with just the key which can be used as a key to the http cache. this key is effectively the request query. maintain the requests as well so the cache knows then it can be cleared! there we go! stateless! 

- need to think about how requests join together and how fragment requests will join together eventually as well when doing something similar to graphql.

- build a very basic chatroom app and ask mehendra how to scale it

- elmish should be agnostic of React
- convert to js es6
- convert to using immutable.js
- add hot module replacement with webpack
- spin up a node/express server
- jsondiffpatch to sync flyd stream to server
- spin up rethinkdb
- query chatrooms against rethinkdb and sync up
- graph query diff refresh

* authentication, auth0? aws?
* crypto chat
* shindig queries

- time-travelling debugger / dev tool
- styleguide
- error reporting
- animation
- undo-redo

- production shell repl
- production deploy

- react native
- hot code-push
- aws services and scaling

- consistent structure for actions, child actions, view names so we can print and track actions easily.
- R.bind and lazy evaluation of views

- elm animation example
- Build a swipe menu / swipeable views

[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992

why js?
- use other peoples code, infinite scrolling, inline svg loader, webpack, etc.
- react native
- isomorphic js