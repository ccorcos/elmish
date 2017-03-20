import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import slice from 'ramda/src/slice'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import append from 'ramda/src/append'
import omit from 'ramda/src/omit'
import pick from 'ramda/src/pick'
import prop from 'ramda/src/prop'
import pipe from 'ramda/src/pipe'
import map from 'ramda/src/map'
import __ from 'ramda/src/__'
import assoc from 'ramda/src/assoc'
import mergeWith from 'ramda/src/mergeWith'
import concat from 'ramda/src/concat'

import h from 'react-hyperscript'

import animation from 'elmish/src/animation'
import concatAllEffects from 'elmish/src/utils/concatAllEffects'


// The pager is an animated version of the tabber. Its gets a list of pages,
// and an index for which one to show. It maintains some state reflecting
// which page is showing so it can animate properly by using raf to kick off
// the animation and set the current page on the next tick.
const pager = (pages, duration=1000, easing='easeInOutQuad') => {

  const init = (index=0) => {
    return {
      index,
      animations: animation.init(),
      states: pages.map(p => p.init())
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'change_page':
        const dx = state.index - action.index
        return pipe(
          assoc('index', action.index),
          evolve({animations: animation.start(easing, duration, dx)}),
          evolve({animations: animation.tick(action.dt)})
        )(state)
      case 'tick':
        return evolve({
          animations: animation.tick(action.dt)
        })(state)
      case 'child':
        return evolve({
          states: adjust(pages[action.i].update(__, action.action), action.i)
        }, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state, {index}) => {

    // when we get see that we've changes pages, we'll request animation
    // frame to start animating to the next page
    const changePage = (dt) => dispatch({type:'change_page', index, dt})
    const tick = (dt) => dispatch({type:'tick', dt})
    const raf = (state.index !== index) ? [changePage] :
                (state.animations.length > 0) ? [tick] : []

    const dx = animation.compute(state.animations)

    // only render the pages that are onscreen or will be in the animation.
    const begin = Math.floor(Math.min(state.index, state.index + dx))
    const end = Math.ceil(Math.max(state.index, state.index + dx))

    // get all the page effects
    const childDispatch = (i) => (action) => dispatch({type: 'child', action, i})
    const pageEffects = pages.map((page, i) => {
      return page.declare(childDispatch(i), state.states[i])
    })

    // we dont want hotkeys to be firing for any of the views that aren't in the
    // foreground
    const fgFx = pick(['hotkeys', 'route'], pageEffects[state.index])
    const bgFx = map(omit(['html', 'hotkeys', 'route']), pageEffects)
    const effects = concatAllEffects(append(fgFx, bgFx))

    const visiblePages = slice(begin, end + 1, map(prop('html'), pageEffects))

    const style = {
      transform: `translate3d(${-(state.index + dx - begin) * 100 / visiblePages.length}%, 0, 0)`,
      flex: 1,
      display: 'flex',
      width: `${100*(end-begin+1)}%`
    }

    return merge(effects, {
      html: h('div.pager', { style }, visiblePages),
      raf: concat(raf, effects.raf || [])
    })
  })

  return {init, declare, update}
}

export default pager
