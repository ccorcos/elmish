export const isString = (x) => Object.prototype.toString.apply(x) === '[object String]'
export const isNumber = (x) => Object.prototype.toString.apply(x) === '[object Number]'
export const isObject = (x) => Object.prototype.toString.apply(x) === '[object Object]'
export const isArray = (x) => Object.prototype.toString.apply(x) === '[object Array]'
export const isFunction = (x) => Object.prototype.toString.apply(x) === '[object Function]'

export default {
  string: isString,
  number: isNumber,
  object: isObject,
  array: isArray,
  function: isFunction,
}