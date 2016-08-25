// helper function for generating nodes. value is optional and should be an
// object and children should be an array.
export default function node(...args) {
  const [value, children] = parseArgs(args)
  return {
    __type: 'node',
    value,
    children,
  }
}

function parseArgs(args) {
  let [value, children] = args
  if (Array.isArray(value)) {
    children = value
    value = {}
  }
  if (!Array.isArray(children)) {
    children = []
  }
  if (!value) {
    value = {}
  }
  return [value, children]
}

function compareObj(o1, o2) {
  const k1 = Object.keys(o1)
  const k2 = Object.keys(o2)
  if (k1.length !== k2.length) {
    return false
  }
  for (var i = 0; i < k1.length; i++) {
    const k = k1[i]
    if (o1[k] && o1[k].__type === 'thunk') {
      if (!equals(o1[k], o2[k])) {
        return false
      }
    } else if (o1[k] !== o2[k]) {
      return false
    }
  }
  return true
}

function compareArray(a1, a2) {
  if (a1.length !== a2.length) {
    return false
  }
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] && a1[i].__type === 'thunk') {
      if (!equals(a1[i], a2[i])) {
        return false
      }
    } else if (a1[i] !== a2[i]) {
      return false
    }
  }
  return true
}

// for comparing node thunks
export function equals(t1, t2) {
  if (!t1 || !t2) {
    return false
  }
  if (t1.fn !== t2.fn) {
    return false
  }
  const [v1, c1] = parseArgs(t1.args)
  const [v2, c2] = parseArgs(t2.args)
  // shallow compare value
  if (!compareObj(v1, v2)) {
    return false
  }
  // shallow compare children
  if (!compareArray(c1, c2)) {
    return false
  }
  return true
}
