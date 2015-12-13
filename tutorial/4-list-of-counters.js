// In the next two examples, I want to demonstrate some of the abstraction
// power in using this pattern. First, we're going to create a high-order
// component to make a list of components.

import h from 'react-hyperscript'
import start from 'src/elmish'
import render from 'src/service/react'
import counter from 'lib/counter'
import curry from 'ramda/src/curry'
import evolve from 'ramda/src/evolve'
import filter from 'ramda/src/filter'
import propEq from 'ramda/src/propEq'
import complement from 'ramda/src/complement'
import findIndex from 'ramda/src/findIndex'
import adjust from 'ramda/src/adjust'
import __ from 'ramda/src/__'
const propNeq = complement(propEq)

// listOf : {init, update, declare} => {init, update, declare}
const listOf = (kind) => {

  // we'll keep track of a list of states and assign each item in the list a
  // unique id to keep track of them.
  const init = () => {
    return {list: [], nextId: 0}
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'insert':
        // create a new child and add it to the list
        const item = {
          id: state.nextId,
          state: kind.init()
        }
        return {
          list: [item].concat(state.list),
          nextId: state.nextId + 1
        }
      case 'remove':
        // Here, I want to start introducing some more utility functions that
        // will make your code even more declarative and explicit. `evolve` is
        // one of my favorite functions. :)
        //
        // http://ramdajs.com/docs/#evolve
        // http://ramdajs.com/docs/#filter
        // http://ramdajs.com/docs/#propEq
        // http://ramdajs.com/docs/#complement
        //
        // Also all Ramda functions are automatically curried with their
        // arguments in a more convenient order. This talk will help you
        // understand the motivation:
        //
        // https://www.youtube.com/watch?v=m3svKOdZijA&app=desktop
        //
        // Using evolve and all these Ramda functions may seem a bit
        // unnecessary right now and you're right, but they become very useful
        // and convenient when your component states get larger and larger,
        // so I want to introduce it right now for you to get comfortable with.
        //
        return evolve({
          list: filter(propNeq('id', action.id))
        }, state)
        //
        // This is equivalent to the following:
        //
        // const {list, ...rest} = state
        // return {
        //   list: list.filter((item) => item.id !== action.id),
        //   ...rest
        // }

      case 'child':
        // when one of the child components dispatches an action, it gets
        // routed here as a child type, so we need to take care of some
        // plumbing to make sure that we update the proper item's state.
        // First, we'll find the index of the item we're interested in.
        const idx = findIndex(propEq('id', action.id), state.list)
        // `adjust` is just like evolve but for arrays. And we're using the
        // amazing `__` operator to curry the first argument of `kind.update`.
        //
        // http://ramdajs.com/docs/#adjust
        // http://ramdajs.com/docs/#__
        //
        // What we're doing here is evolving the state, by adjusting the list
        // at a certain index by evolving that item's state with kind.update
        // partially applied with the action's child action. This might look
        // like a total mess right now, but once you get more familiar with
        // these functions, its actually very concise and specific.
        return evolve({
          list: adjust(evolve({
            state: kind.update(__, action.action)
          }), idx)
        }, state)
      default:
        console.warn("Unknown action:", action)
        return state
    }
  })

  const declare = curry((dispatch, state) => {
    // wrap child actions with a child type
    const childDispatch = id => action => dispatch({type: 'child', action, id})
    // we'll have insert and remove buttons wrapping each child item.
    return {
      html:
        h('div.list-of', [
          h('button.insert', {
            onClick: () => dispatch({type: 'insert'})
          }, '+'),
          state.list.map((item) => {
            return (
              h('div.item', {key:item.id}, [
                kind.declare(childDispatch(item.id), item.state).html,
                h('button.remove', {
                  onClick: () => dispatch({type: 'remove', id: item.id})
                }, 'x')
              ])
            )
          })
        ])
    }
  })
  return {init, update, declare}
}

// now we'll put it together
start(listOf(counter), [render])

// Boom, thats it! One thing that really demonstrates the power of this
// abstraction is how you can create a list of a list of counters trivially.
// Try it out:

// start(listOf(listOf(counter)), [render])
