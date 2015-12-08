html = require('react').DOM
R = require('ramda')

require 'src/star-list.styl'

spinner = require 'src/spinner.coffee'

effects = (login) ->
  {$github: ['stars', {login}, ['full_name', 'html_url', 'stargazers_count']]}

view = (data) ->
  if data.stars.$pending
    spinner()
  else if data.stars
    item = (repo) ->
      html.div
        key: repo.id
        className: 'repo-item'
        html.div
          className: 'stars'
          repo.stargazers_count
        html.a
          className: 'name'
          href: repo.html_url
          repo.full_name
    R.pipe(
      R.sortBy(R.prop('stargazers_count'))
      R.reverse
      R.map(item)
    )(data.stars)
  else if data.error
    html.div
      className: 'error'
      error.message
  else
    console.warn("this shouldn't happen")
    

module.exports = {effects, view}