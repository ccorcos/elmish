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
        request: [base + 'following', {method: 'get'}]
        transform: (response) ->
          response.json()
            .then (result) -> {[name]: result}
            .catch (error) -> {error}
    when 'stars'
      $fetch:
        request: [base + 'starred', {method: 'get'}]
        transform: (response) ->
          response.json()
            .then (result) -> {[name]: result}
            .catch (error) -> {error}
    else
      console.warn "unknown github request", [name, args, fragments]

module.exports = translateGithubApi
