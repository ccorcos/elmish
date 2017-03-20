import R from 'ramda'
import h from 'react-hyperscript'
import concatAllEffects from 'elmish/src/utils/concatAllEffects'

// think about how tabvc works. we should use a pusher to maintain the state
// and navvc should just accept children

const navvc = (root, getScene) => {

  const init = () => {
    return {
      scenes: [root],
      states: [getScene(root).init()]
    }
  }

  const update = R.curry((state, action) => {
    switch (action.type) {
      case 'push':
        return R.evolve({
          scenes: R.append(action.scene),
          states: R.append(getScene(action.scene).init())
        }, state)
      case 'pop':
        return R.evolve({
          scenes: R.init,
          states: R.init,
        }, state)
      case 'child':
        // XXX I really wish there was a cleaner way of doing this every time.
        const updateChildState = getScene(state.scenes[action.index]).update(R.__, action.action)
        const updateChildStates = R.adjust(updateChildState, action.index)
        return R.evolve({states: updateChildStates}, state)
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

    const push = (scene) => dispatch({type:'push', scene})
    const pop = () => dispatch({type:'pop'})
    const dispatchChild = (index) => (action) => dispatch({type:'child', index, action})
    const declareChild = (c, i) => c.declare(dispatchChild(i), state.states[i], {push, pop})
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
