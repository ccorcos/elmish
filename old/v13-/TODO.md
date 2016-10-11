# TODO

- make a v13
  - think about when / how we construct init, update, publish, subscribe, hotkeys, and dynamic children.
  - init
    - this needs to be shallow first so that parent components can construct the state pass it on to their lifted children that can write to that state. one complication comes when lifted children have a lensIndex in there. In this case, the parent must be sure to create the array with that index -- preferably, the parent should just use `_init` to override the initialization the rest of the way down and manually create the state it wants. in this case, it makes sense if every lifted component constructs it children when its initialized, but then again, we should probably do this on demand as we traverse the tree...
  - update
    - 


  - refactor v12 configure/start using middleware spec.
    - test out deeper lifting
      - children with children with children
        - we need to think harder about how we initialize state. in a way that we can construct it when components are nested deeply, and in a way that we can derive children dynamically from state as we go.
    - batch dispatching
    - runtime type checking
    - refactor plugins
      - we shouldnt have to reduce subscribe twice
      - lets lazily reduce through the component tree for publish / subscribe
        - save the computation for next time and compute the reduction lazily!
      - update lazy-tree to handle merging sublings and parents separately to be more generic
    - handle dynamic children

- note, children dont need to be lifted -- ?


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