import curry from 'ramda/src/curry'

const strangle = curry((min, max, value) => {
  return value < min ? min :
         value > max ? max :
         value
})

export default strangle