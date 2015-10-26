# Elmish

This is a toy project implementing the [Elm architecture][arch] with React and Coffeescript.

To get it running:
  
    git clone https://github.com/ccorcos/elmish.git
    cd elmish
    npm install
    webpack-dev-server
    open http://localhost:8080/

Check out `entry.coffee` to select the example you want to run.

The Elm archirecture is a very power functional programming pattern for building user interfaces with all kinds of perks. Views are pure funtions of the state of the program. This means you can render any view in any state. So you could create an app of every view in every state making it trivial to re-style your app. You can also record the actions and the state making it easy to implement undo/redo, invalidate latency compensation action, and debug production errors.

## To Do

- [How to use RxJS?][rxjs-issue]
  - RxJS would make a lot of sense. Elm has a really nice Signal library. I ran into all kinds of weird issues with Rx though. With RxJS, we can add a `signals` input to `start` like they do in Elm so the app can respond to external actions such as incoming data over websockets.

- Virtual DOM Diffing
  - Should I wrap all views in a React component? Or create a high-order function for diffing/memoizing the view functions?
  - May need to wrap in a React component so I can set the key for the component when iterating through a list.
  - Implement `bind` which allows you to compare bound functions using `f.equals(g)` to optimize diffing.

- Animation example
- Implement undo/redo
- Implement error reporting with initial model and action sequences
- Time-travelling debugger - commit actions, undo actions, etc.
- Giphy example with text input for the topic
- Investigate form abstraction
- Build a swipe menu / swipeable views
- Use Immutable.js

[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992