import curry from 'ramda/src/curry'
import differenceWith from 'ramda/src/differenceWith'
import intersectionWith from 'ramda/src/intersectionWith'

const vennDiagramWith = curry((cmp, a, b) => {
  return [
    differenceWith(cmp, a, b),
    intersectionWith(cmp, a, b),
    differenceWith(cmp, b, a)
  ]
})

export default vennDiagramWith
