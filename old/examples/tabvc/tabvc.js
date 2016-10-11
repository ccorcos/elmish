
import curry from 'ramda/src/curry'
import curryN from 'ramda/src/curryN'
import merge from 'ramda/src/merge'
import __ from 'ramda/src/__'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import omit from 'ramda/src/omit'
import prop from 'ramda/src/prop'
import addIndex from 'ramda/src/addIndex'
import map from 'ramda/src/map'
import pipe from 'ramda/src/pipe'

import h from 'react-hyperscript'

import concatAllEffects from 'elmish/src/utils/concatAllEffects'

const mapIndexed = addIndex(map)

/*
TabVC simply maintains an `index` state which it passes to its children
along with `change` to change the index of the tab view. This way, you
can render the tabbar and tabview entirely independantly of each other
and still maintain one-directional data flow.

childen : {
  init : (initialIndex) => state
  update : (state, action) => state
  declare : (dispatch, state, {index, change})
}
*/

// XXX Literally half this code is just boilerplate and plumbing.
// There must be a better way. Can't quite use component because we need
// to set props on the children as well.

const tabvc = (children, initialIndex=0) => {

  const init = () => {
    const initChild = (c) => c.init(initialIndex)
    return {
      index: initialIndex,
      states: map(initChild, children)
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'change':
        return merge(state, {
          index: action.index
        })
      case 'child':
        // XXX I really wish there was a cleaner way of doing this every time.
        const updateChildState = children[action.index].update(__, action.action)
        const updateChildStates = adjust(updateChildState, action.index)
        return evolve({states: updateChildStates}, state)
      default:
        return state
    }
  })

  const style = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column'
  }

  const declare = curry((dispatch, state) => {

    // change the tab index
    const change = (index) => dispatch({'type': 'change', index})
    const dispatchChild = (index) => (action) => dispatch({type:'child', index, action})
    const declareChild = (c, i) => c.declare(dispatchChild(i), state.states[i], {index: state.index, change})
    const effects = mapIndexed(declareChild, children)

    const html = map(prop('html'), effects)
    const fx = pipe(
      map(omit(['html'])),
      concatAllEffects
    )(effects)

    return merge(fx, {
      html: h('div.tabvc', {style}, html),
    })
  })

  return {init, declare, update}
}

export default tabvc
