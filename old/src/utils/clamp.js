import curry from 'ramda/src/curry'

// https://github.com/ramda/ramda/pull/1564
const clamp = curry((min, max, value) => {
  return value < min ? min :
         value > max ? max :
         value
})

export default clamp