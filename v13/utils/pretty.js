const addSuffix = R.flip(R.add)

// pretty printing actions
export const prettyPath = (path) => {
  if (isString(path) || isNumber(path)) {
    return `${path}`
  } else if (isObject(path)) {
    return R.pipe(
      R.toPairs,
      R.map(R.join(':')),
      R.join(','),
    )(path)
  } else if (isArray(path)) {
    return R.pipe(
      R.map(prettyPath),
      R.join('/'),
      addSuffix(' -> ')
    )(path)
  } else {
    throw new TypeError(`Unknown path: ${path}`)
  }
}

export const prettyAction = (action) => {
  if (isArray(action)) {
    return prettyPath(action[0]) + prettyAction(action[1])
  } else {
    return action
  }
}

export default {
  path: prettyPath,
  action: prettyAction,
}
