import curry from 'ramda/src/curry'
import reduce from 'ramda/src/reduce'
import concat from 'ramda/src/concat'
import mergeWith from 'ramda/src/mergeWith'

const mergeAllWith = curry((fn, list) => reduce(mergeWith(fn), {}, list))
const concatEffects = mergeAllWith(concat)

export default concatEffects