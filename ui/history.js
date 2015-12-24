import curry   from 'ramda/src/curry'
import merge   from 'ramda/src/merge'
import evolve  from 'ramda/src/evolve'
import __      from 'ramda/src/__'

// this is a basic history UI component that mimics the typical
// window.history functionality and works with the routing service
const history = (app) => {

  // app : {
  //   init    : () => state
  //   update  : (state, action) => state
  //   declare : (dispatch, state, {path, go}) => effects
  // }

  const init = () => {
    const path = window.location.pathname
    return {
      path: path,
      child: app.init(path)
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'set_path':
        return merge(state, {
          path: action.path
        })
      case 'child':
        return evolve({
          child: app.update(__, action.action)
        }, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state) => {

    const setPath = (path) => dispatch({type: 'set_path', path})
    const childDispatch = (action) => dispatch({type:'child', action})

    const effects = app.declare(childDispatch, state.child, {
      path: state.path,
      go: setPath
    })

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
