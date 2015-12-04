# https://developer.github.com/v3/
# https://api.github.com/users/ccorcos/following
# https://api.github.com/users/ccorcos/starred

R = require 'ramda'

username = 'ccorcos'
base = "https://api.github.com/users/#{username}/"

translateGithubApi = ({$github: [name, args, fields]}) ->
  switch name
    when 'following'
      $fetch:
        name: name
        args: [base + 'following', {method: 'get'}]
    when 'stars'
      $fetch:
        name: name
        args: [base + 'starred', {method: 'get'}]
    else
      console.warn "unknown github request", [name, args, fragments]

module.exports = translateGithubApi
