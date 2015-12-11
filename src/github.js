import merge from 'ramda/src/merge'

export const following = (name, opts) => {
  return merge(opts, {
    key: `following-${name}`,
    url: `https://api.github.com/users/${name}/following`,
    method: 'get'
  })
}

export const stars = (name, opts) => {
  return merge(opts, {
    key: `stars-${name}`,
    url: `https://api.github.com/users/${name}/starred`,
    method: 'get'
  })
}

export default {following, stars}
