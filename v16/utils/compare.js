import { isFunction } from 'elmish/v13+/utils/is'
import equals from 'ramda/src/equals'

export const deepEquals = equals

export const shallowEquals = (obj1, obj2) => {
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

const effectArgsEquals = ([name1, child1, props1], [name2, child2, props2]) => {
  return name1 === name2
      && child1 === child2
      && deepEquals(props1.dispatch, props2.dispatch)
      && shallowEquals(props1.props, props2.props)
}

export const effectEquals = (node1, node2) => {
  return node1.fn === node2.fn && effectArgsEquals(node1.args, node2.args)
}
