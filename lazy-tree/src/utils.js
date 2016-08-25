
// similar to R.zip except we do not truncate
export function zip(list1, list2) {
  const result = []
  const len = Math.max(list1.length, list2.length)
  let idx = 0
  while (idx < len) {
    result[idx] = [list1[idx], list2[idx]]
    idx += 1
  }
  return result
}
