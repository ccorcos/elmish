// referential equality
export const eq = (a, b) => {
  if (a === b) {
    return true
  }
  if (a && a.equals && a.equals(b)) {
    return true
  }
  return false
}

// shallow object equality
export const compare = (a, b) => {
  if (a === b) {
    return true
  }
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) {
    return false
  }
  for (var i = 0; i < ak.length; i++) {
    const k = ak[i]
    if (!eq(a[k], b[k])) {
      return false
    }
  }
  return true
}