export const shallowCompare = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true
  } else if (!obj1 || !obj2) {
    return false
  } else {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    if (keys1.length !== keys2.length) {
      return false
    } else {
      for (var i = 0; i < keys1.length; i++) {
        if (obj1[keys1[i]] !== obj2[keys1[i]]) {
          // TODO comparing thunks here!
          if (isFunction(obj1[keys1[i]])) {
            if (!R.equals(obj1[keys1[i]], obj2[keys1[i]])) {
              return false
            }
          } else {
            return false
          }
        }
      }
      return true
    }
  }
}

export default {
  shallow: shallowCompare,
}