## To Do

better middleware:
- dynamic lift - derive types based on state
- lazy react components
- merge and compose publication lenses
- performance?

- giphy example
- listOf example
- undoable example

- graphql for data fetching
- use relay / apollo as a service
- record and publish state
  - help form
  - user tracking
  - time-travel
    - think about how you can have two components communicate rather easily now
      you can place the root, which publishes state / hooks, and now you're free
      to place the slide wherever in the DOM heirarchy.

- immutable.js
- types?
- acid tests

standardize type signatures and interfaces
possibly implement in Elm 0.16?

```js
type Action = { type, payload }
type Dispatch = Function
type Component = {
  init :: () -> State
  update :: (Action, State) -> State
  publish :: (Dispatch, State) -> Publication
  [declare] :: (Dispatch, State, Publication, Props) -> DDS
}
type Service = {
  connect :: (Stream DDS) -> async IO
  lift :: ({ name: DDS }) -> DDS
}
type Transform = ({ name: Service }, Component) -> Component
```


























---

- performance
- more animation examples:
  - https://medium.com/@nashvail/a-gentle-introduction-to-react-motion-dc50dd9f2459#.xzpy50tp8

- whats I dont like so much
  - its not necessarily performant at scale
  - animating everything with rAF will make it less performant but I'd like to
  - so much boilerplate and repetition when there are children but its mildly different every time!

- tabvc
- navvc
- tab-nav app
- webpack build distributable files
  - deploy demos on gh_pages branch

- chatroom app
  - websocket service
  - latency compensation

- http caching
- auth service
- report errors on exceptions
- record, save, replay widget
- generative testing
- predictive testing

- physics animations
  - gravitas.js
  - hammer.js
  - slalom.js
  - assortment of sliders, durations, and easing functions

- cassoway constrain solver for layout in js
  - make a UI for building UI's
  - slalom.js
  - autolayout.js
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
