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

action, state -> state

        state -> $github   -> $fetch  ->| fetcher    |-> action
              -> $twitter  /
              -> $chatroom -> $meteor ->| subscriber |-> action
              -> html                 ->| renderer   |-> action
              -> animation            ->| ticker     |-> action

the -er's perform mutations / side-effects and have async callbacks.
we should be to define these signals in a way that we can lift their "view" functions which provide the declarative data structure with async callbacks to dispatch actions.

I like how the fetcher works again, like it did in beyond/http.coffee, just managing whats needed and whats in flight. we need it this way so we can do time-travelling and abstract well.

github = (dispatch, state) ->
  gh.following
    limit: 20
    dispatch: dispatch
    user.fields()
  
This is clever but we end up doubling the render cycle. What if the data is already cached? We dont want to flash a loading screen.

That changes the way we look at this with the action coming out of the async github tree

action, state -> state

        state -> $github   -> $fetch  ->| fetcher    |-> action
              -> $twitter  /
              -> $chatroom -> $meteor ->| subscriber |-> action
              -> html                 ->| renderer   |-> action
              -> animation            ->| ticker     |-> action

        state -> html            ->| render |-> action
              -> animation       ->| reqAF  |-> action
              -> github -> fetch -> data 
                                 \>| fetcher |-> action

github needs some kind of middleware to generate the date between update and view.

init : () -> state

update : (state, action) -> state

view : (dispatch, state) -> html

The confusing part is that we use the effects tree twice. Once to generate the data in the state in case any is cached. And again to generate a delarative message to http to do diffing and fetching. Now we've leaked state to http again!

ideas:
1) we could use middleware to populate the github tree template before it heads off to view. This would be similar to what we just had except state and effects would be in the same atom. This means, we'll be parsing the state tree every time for queries. This is definitely a step in the right direction. but not all the way there because we've still leaked state to http.
2) http is a high-order function that maintiains its own cache in the state/update function and crawls its children's states to populate them! :) it

httpUpdate = (state, action) ->
  switch action.type
    when ''
      update the leaves based on the http cache right here.
      the items in the cache now have the translated versions
      at the very top, we have middleware to pull all of this out of the state and pass it to the fetcher which keeps track of pending and sends responses back.?


init : () -> state

update : (state, action) -> state

view : (dispatch, state) -> html

its all about pure functions. remember. view/render and populting data and fetching are all similar in that they are just side-effects of state. they're all just views, but since we're populating data, now we need to string them along. 

flyd.on(
  (state) ->
    populateWithData(state)
, state$)


fuck, lost again. what if we crawl the tree and accumulate fragmenets to compose queries together. so we get the queries nicely. This state needs to contain the http state, the app state, etc. damn. so confusing!





we have the html abstracted up as well, and at some point we need to hook in the disaptch. we need to do this like an event listener in react. remember, this doesnt need to be serializable since its not an action. dispatch will wrap up the action. actions could also be sent in batch so multiple components listening to the same data get updates in the same render loop. we could even use requestAnimationFrame to do the update batching?



view = ({selected, select, data}) ->
  if data.following.$pending
    spinner()
  else if data.following
    data.following.map (user) ->
      html.div
        key: user.id
        className: 'item' + (if user.login is selected then ' selected' else '')
        onClick: -> select(user.login)
        userItem.view(user)
  else if data.error
    html.div
      className: 'error'
      error.message    
  else
    console.warn("shouldn't be here")



ui component:
- init
- update

- effects
- view



What if the effects were nested right into the state with $fetch, etc.
The data comes right back to us in the state however we need it. we just need middleware now to handle all the side-effects

init    : () -> state
update  : (state, action) -> state
view    : (dispatch, state) -> html


init    : () -> state
update  : (state, action) -> {state, effects}
view    : (dispatch, state) -> html




ui.effects : (state) -> effects
api        : (effects) -> fxEffects
fx.wrap    : (fxEffects) -> action

fx.init    : () -> state
fx.update  : (state, action) -> state
fx.data    : (dispatch, state) -> data



[arch]: https://github.com/evancz/elm-architecture-tutorial
[rxjs-issue]: https://github.com/Reactive-Extensions/RxJS/issues/992
