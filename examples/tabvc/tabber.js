import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import reduce from 'ramda/src/reduce'
import __ from 'ramda/src/__'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import map from 'ramda/src/map'
import omit from 'ramda/src/omit'
import pipe from 'ramda/src/pipe'
import call from 'ramda/src/call'
import prop from 'ramda/src/prop'
import append from 'ramda/src/append'
import pick from 'ramda/src/pick'
import addIndex from 'ramda/src/addIndex'
import concat from 'ramda/src/concat'

import h from 'react-hyperscript'

import concatAllEffects from 'elmish/src/utils/concatAllEffects'

const mapIndexed = addIndex(map)

/*
Tabber is a simple component that renders one of its children based on
its `index` prop.
*/

const tabber = (children) => {

  const init = () => {
    const initChild = (c) => c.init()
    return {
      states: map(initChild, children)
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'child':
        // XXX I really wish there was a cleaner way of doing this every time.
        const updateChildState = children[action.index].update(__, action.action)
        const updateChildStates = adjust(updateChildState, action.index)
        return evolve({states: updateChildStates}, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state, props) => {

    const declareChild = (child, index) => {
      return child.declare(
        (action) => dispatch({type: 'child', action, index}),
        state.states[index],
        props
      )
    }

    // compute child effects
    const effects = mapIndexed(declareChild, children)

    // foreground view
    const fg = effects[props.index]

    // background effects
    const bgFx = map(
      omit(['html', 'hotkeys', 'route']),
      effects
    )

    // foreground effects
    const fgFx = [
      pick(['hotkeys', 'route'], fg)
    ]

    // all effects except html
    const fx = concatAllEffects(concat(bgFx, fgFx))

    const style = {
      flex: 1,
      display: 'flex'
    }

    return merge(fx, {
      html: h('div.pager', { style }, fg.html)
    })
  })

  return {init, update, declare}
}

export default tabber
