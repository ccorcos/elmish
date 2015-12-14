import curry from 'ramda/src/curry'
import difference from 'ramda/src/difference'
import intersection from 'ramda/src/intersection'

const vennDiagram = curry((a, b) => {
  return [
    difference(a, b),
    intersection(a, b),
    difference(b, a)
  ]
})

export default vennDiagram
