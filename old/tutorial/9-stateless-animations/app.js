import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'

import checkbox from 'elmish/tutorial/9-stateless-animations/checkbox'

// some boilerplate to get the swtich up and running
const init = (value=false) => {
  return {
    value,
    child_state: checkbox.init(value)
  }
}

const update = curry((state, action) => {
  switch (action.type) {
    case 'set_value':
      return merge(state, {
        value: action.value
      })
    case 'child_action':
      return merge(state, {
        child_state: checkbox.update(state.child_state, action.action)
      })
    default:
      return state
  }
})

const declare = curry((dispatch, state) => {
  const childDispatch = (action) => dispatch({type: 'child_action', action})
  const onChange = (e) => dispatch({type: 'set_value', value: e.target.value})
  // Now, we're using props to communicate from between parent and child components.
  // But not that this is still one-directional dataflow. The child should never be
  // subscribing though props because there are no lifecycle hooks!
  const props = {onChange, value: state.value, width: 200}
  const effects = checkbox.declare(childDispatch, state.child_state, props)
  return effects
})

export default { init, update, declare}