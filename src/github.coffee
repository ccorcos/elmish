# https://developer.github.com/v3/
# https://api.github.com/users/ccorcos/following
# https://api.github.com/users/ccorcos/starred

R = require 'ramda'

username = 'ccorcos'
base = "https://api.github.com/users/"

translateGithubApi = ({$github: [name, args, fields]}) ->
  switch name
    when 'following'
      $fetch:
        name: name
        args: ["https://api.github.com/users/ccorcos/following", {method: 'get'}]
    when 'stars'
      $fetch:
        name: name
        args: ["https://api.github.com/users/#{args.login}/starred", {method: 'get'}]
    else
      console.warn "unknown github request", [name, args, fragments]

module.exports = translateGithubApi
