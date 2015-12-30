import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import evolve from 'ramda/src/evolve'
import __ from 'ramda/src/__'

// This is a basic history UI component that mimics the typical
// `window.history` functionality and works with the routing service.
// This component lets `window.history` entirely dictate the
// the current route. Use this component when you want the most basic
// linear routing typically associated with the browser.
const history = (app) => {

  // app is a component but gets some extra properties.
  // app : {
  //   init    : () => state
  //   update  : (state, action) => state
  //   declare : (dispatch, state, {path, go}) => effects
  // }

  const init = () => {
    const path = window.location.pathname
    return {
      path: path,
      child_state: app.init(path)
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'set_path':
        return merge(state, {
          path: action.path
        })
      case 'child_action':
        return evolve({
          child_state: app.update(__, action.action)
        }, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state) => {

    const setPath = (path) => dispatch({type: 'set_path', path})
    const childDispatch = (action) => dispatch({type:'child_action', action})

    const props = { path: state.path, go: setPath }
    const effects = app.declare(childDispatch, state.child_state, props)

    return merge(effects, {
      route: [{
        path: state.path,
        onBack: setPath,
        onForward: setPath,
        onSkip: setPath
      }]
    })
  })

  return {init, update, declare}
}

export default history
