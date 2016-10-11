import { isFunction } from 'elmish/v13+/utils/is'

export const shallow = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true
  }
  if (!obj1 || !obj2) {
    return false
  }
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) {
    return false
  }
  for (var i = 0; i < keys1.length; i++) {
    const v1 = obj1[keys1[i]]
    const v2 = obj2[keys1[i]]
    if (v1 !== v2) {
      if (v1.__type === 'thunk') {
        if (!v1.equals(v2)) {
          return false
        }
      } else {
        return false
      }
    }
  }
  return true
}
