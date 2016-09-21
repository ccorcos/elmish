export const isString = (x) => Object.prototype.toString.apply(x) === '[object String]'
export const isNumber = (x) => Object.prototype.toString.apply(x) === '[object Number]'
export const isPlainObject = (x) => Object.prototype.toString.apply(x) === '[object Object]' && x.constructor === Object
export const isArray = (x) => Object.prototype.toString.apply(x) === '[object Array]'
export const isFunction = (x) => Object.prototype.toString.apply(x) === '[object Function]'

export default {
  string: isString,
  number: isNumber,
  plainObject: isPlainObject,
  array: isArray,
  function: isFunction,
}
