// An obvious thing to do next is create event listeners to list for `cmd z`
// and `cmd y` to do undo and redo for you. The only problem is that we don't
// have lifecycle methods. One solution would be to create a React component
// and use document.addEventListener on componentWillMount and also use
// document.removeEventListener on componentWillUnmount. This would work, but
// it introduces side-effects to our user-interface. It doesn't seem like a big
// deal right now (and in this case is isn't), but once we start dealing with
// HTTP requests, you'll see why it helps to offload side-effects to services.
// For now, this is just a gentle introduction to declaring side-effects other
// than rendering HTML.

// pretty much everything is the same as before except a few things:
import h from 'react-hyperscript'
import start from 'src/elmish'
import render from 'src/service/react'
import counter from 'lib/counter'
import curry from 'ramda/src/curry'
import evolve from 'ramda/src/evolve'
import dec from 'ramda/src/dec'
import inc from 'ramda/src/inc'
import concat from 'ramda/src/concat'
import take from 'ramda/src/take'
import merge from 'ramda/src/merge'

// We're going to import the hotkeys service. This service takes a declarative
// object of key value pairs where the key is a string describing the hotkey
// combination and the value is a callback.
import hotkeys from 'src/service/hotkeys'

const undoable = (kind) => {

  const init = () => {
    return {
      list: [kind.init()],
      time: 0
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'undo':
        return evolve({
          time: dec
        }, state)
      case 'redo':
        return evolve({
          time: inc
        }, state)
      case 'child':
        const past = take(state.time, state.list)
        const current = state.list[state.time]
        const next = kind.update(current, action.action)
        return merge(state, {
          list: concat(past, [current, next]),
          time: state.time + 1
        })
      default:
        console.warn('Unknown action:', action)
        return state
    }
  })

  const declare = curry((dispatch, state) => {
    const childDispatch = (action) => dispatch({type: 'child', action})
    const canUndo = state.time > 0
    const canRedo = state.time < state.list.length - 1
    return {
      html:
        h('div.undoable', [
          h('button.undo', {
            disabled: !canUndo,
            onClick: () => canUndo ? dispatch({type: 'undo'}) : null
          }, 'undo'),
          h('button.redo', {
            disabled: !canRedo,
            onClick: () => canRedo ? dispatch({type: 'redo'}) : null
          }, 'redo'),
          kind.declare(childDispatch, state.list[state.time]).html
        ]),
      // All we need to do is now add a declarative data structure describing
      // the hotkeys we want to listen to and what we want them to do. The
      // hotkey service will take care of all mutations and adding/removing
      // event listeners, etc.
      hotkeys: {
        'cmd z': () => canUndo ? dispatch({type: 'undo'}) : null,
        'cmd y': () => canRedo ? dispatch({type: 'redo'}) : null
      }
    }
  })

  return {init, update, declare}

}

// Now we need to make sure we add hotkeys as another service
start(undoable(counter), [render, hotkeys])

/*
Lets review how this works in a little more detail. `declare` returns an
object of declarative datastructures with bound callbacks for async actions.
When we map over the the state$ to get the effects$, we call each service
with the effects$. The service will the read a specific property of the
effects object and perform whatever side-effects necessary.

TODO: One challenge I've yet to completely solve is how to deal with
services in a generic way with regards to abstraction. For example, suppose
we want to make a list of this type of undoable counter. In the listOf
component, we'll need to come up with some way concatenating the hotkeys
requirements of each subcomponent. There are a variety of ways we could
implement this but here's one solution:

import difference from 'ramda/src/difference'
import intersection from 'ramda/src/intersection'
import merge from 'ramda/src/merge'
import pick from 'ramda/src/pick'
import keys from 'ramda/src/keys'
import map from 'ramda/src/map'
import fromPairs from 'ramda/src/fromPairs'
const mergeHotkeys = (a, b) => {
  const aKeys = keys(a)
  const bKeys = keys(b)
  const uniqHotKeys = merge(
    pick(difference(aKeys, bKeys), a),
    pick(difference(bKeys, aKeys), b)
  )
  const sameKeys = intersection(aKeys, bKeys)
  const joinKeysAsPairs = (key) => [key, () => { a[key](); b[key]() }]
  const sameHotKeys = fromPairs(map(joinKeysAsPairs, sameKeys))
  return merge(uniqHotKeys, sameHotKeys)
}

This works satisfactorily but the only issue is that now our listOf component
needs to be service-aware. That is, if I want to create a new service, then I'll
need to add another line to my listOf component to merge those service
declarations if they're there. Thus, I think a more generic way of doing this
if making service declarations a monadic type that has a prototype .merge
function for combining arbitrary services that high-order components like the
listOf component aren't concerned with.

*/
