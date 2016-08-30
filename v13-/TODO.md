# TODO

- make a v13
  - refactor v12 configure/start using middleware spec.
    - batch dispatching
    - runtime type checking
  - rename lifted to to be children because thats what they are and they dont have to be lifted
  - try pubsub first and crawl the children
  - save the computation for next time and compute the reduction lazily!

- make React its own service with its own lazy, lift, and crawl/merge lifted children.

- note, children dont need to be lifted!


- crawl lifted subcomponents when a side-effect or publish/subscribe is not defined for that component
  - for dynamic children, you need to initialize the state yourself and have a \_lifted function that gets state and returns lifted components. whenever a function is prefixes with a \_, it means that it is unliftable. so for example, if you want to take charge of a component's children's update functions, you just define \_update instead of update and now you control all the actions for the subcomponents.

- publish / subscribe using lazy-tree
- hotkeys using lazy-tree
- http using lazy-tree

---

all elmish handles is init / update / dispatch. theres middleware for creating
new streams, that are then lifted together and pumped into drivers.

```js
export const configure = drivers => app => {
  const event$ = flyd.stream()
  const state$ = flyd.scan(
    (state, {action, payload}) => app.update(state, action, payload),
    app.init(),
    event$
  )
  const _dispatch = (action, payload, ...args) =>
    isFunction(payload) ?
    event$({action, payload: payload(...args)}) :
    event$({action, payload})

  const dispatch = (action, payload) => partial(_dispatch, action, payload)
  const pub$ = flyd.map(state => app.subscribe(state, app.publish(dispatch, state)), state$)

  const handlers = drivers.map(driver => driver(app, dispatch))

  flydLift((state, pub) => {
    handlers.forEach(handler => handler(state, pub))
  }, state$, pub$)
}
```