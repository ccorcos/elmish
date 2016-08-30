
export const liftAction = (path, action) => {
  return [path, action]
}

export const unliftAction = (action) => {
  return action[1]
}

export const isLiftedAction = (path, action) => {
  return isArray(action) && R.equals(action[0], path)
}

const _liftDispatch = (dispatch, path, action, payload) => dispatch(liftAction(path, action), payload)

export const liftDispatch = (dispatch, path) => partial(_liftDispatch, dispatch, path)
