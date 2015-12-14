import curry from 'ramda/src/curry'
import pick from 'ramda/src/pick'
import merge from 'ramda/src/merge'
import keys from 'ramda/src/keys'
import map from 'ramda/src/map'
import fromPairs from 'ramda/src/fromPairs'
import vennDiagram from 'src/utils/vennDiagram'

const mergeWith = curry((fn, a, b) => {
  const [aKeys, bothKeys, bKeys] = vennDiagram(keys(a), keys(b))
  const uniqObjValues = merge(pick(aKeys, a), pick(bKeys, b))
  const mergeKeysToPairs = (key) => [key, fn(a[key], b[key])]
  const mergedObjValues = fromPairs(map(mergeKeysToPairs, bothKeys))
  return merge(uniqObjValues, mergedObjValues)
})

export default mergeWith
