rxjs? restart with model. re-run actions. time-travelling debugger

build gif example with text input
build animation example
build a form
build a swipe menu

ramda for immutable.js? 

wrap into react?
elmish front-end package

record actions and models
time-travelling debugger

performance
- re-computing views. memoize or react?
- updating everything. immutable.js with cursors?! ramda?




how to do declarative neo4j graph query dependencies

websockets and user auth / oauth

https://github.com/dthree/vantage

docker and kubernetes


rename to elmish
pipe through react for dom diffing and react dev tools
use immutable.js and build ramda for immutable.js
function binding, calling, equality helpers.

git clone
npm i
./webpack-dev-server
open http://localhost:8080/


https://github.com/evancz/elm-architecture-tutorial/tree/master/examples/4



# init : () -> state
# update : (state) -> (action) -> state
# view : (context, dispatch, state) -> html
renderLoop = (state) ->
  dispatch = pipe(update(state), renderLoop)
  render view({}, dispatch, state)
renderLoop(init())




Immutable.js. Functional API to Immutable.js.
React Keys and DOM diffing.

