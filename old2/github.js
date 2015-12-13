import merge from 'ramda/src/merge'
import curry from 'ramda/src/curry'

export const following = curry((name, opts) => {
  return merge(opts, {
    key: `following-${name}`,
    url: `https://api.github.com/users/${name}/following`,
    method: 'get'
  })
})

export const stars = curry((name, opts) => {
  return merge(opts, {
    key: `stars-${name}`,
    url: `https://api.github.com/users/${name}/starred`,
    method: 'get'
  })
})

export default {following, stars}
