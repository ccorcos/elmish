
// concatAllEffects, concatEffects

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

import h from 'react-hyperscript'

import concatEffects from 'elmish/utils/concatEffects'

// a component has children and takes care of the wiring for you :)

const tabber = component({
  declare: (effects, dispatch, state, props) => {
    const {index} = props

    // foreground view
    const fg = effects[index]

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
  }
})

export default tabber
