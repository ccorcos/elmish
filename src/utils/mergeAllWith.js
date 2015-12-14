import mergeWith from 'src/utils/mergeWith'
import curry from 'ramda/src/curry'
import reduce from 'ramda/src/reduce'

const mergeAllWith = curry((fn, list) => {
  return reduce(mergeWith(fn), {}, list)
})

export default mergeAllWith
