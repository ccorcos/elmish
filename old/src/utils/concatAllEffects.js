import reduce from 'ramda/src/reduce'
import concatEffects from 'elmish/src/utils/concatEffects'

const concatAllEffects = reduce(concatEffects, {})

export default concatAllEffects

