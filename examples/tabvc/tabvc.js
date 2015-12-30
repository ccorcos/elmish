import h from 'react-hyperscript'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import __ from 'ramda/src/__'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import omit from 'ramda/src/omit'
import prop from 'ramda/src/prop'
import concatEffects from 'elmish/utils/concatEffects'

const styles = {
  tabvc: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
}

const tabvc = (children, initialIndex=0) => {

  const init = () => {
    return {
      index: initialIndex,
      states: children.map(c => c.init(initialIndex))
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'change':
        return merge(state, {
          index: action.index
        })
      case 'child':
        return evolve({
          states: adjust(children[action.index].update(__, action.action), action.index)
        }, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state) => {

    const childDispatch = (index) => (action) => dispatch({type:'child', index, action})
    const change = (index) => dispatch({'type': 'change', index})
    const effects = children.map((c, i) => c.declare(childDispatch(i), state.states[i], {index: state.index, change}))

    const html = effects.map(prop('html'))
    const fx = concatEffects(effects.map(omit(['html'])))

    return merge(fx, {
      html: h('div.tabvc', {style: styles.tabvc}, html),
    })
  })

  return {init, declare, update}
}

export default tabvc
