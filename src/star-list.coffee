html = require('react').DOM

fetch = (id) ->
  {$github: ['stars', {id}, ['full_name', 'html_url', 'stargazers_count']]}

view = (data) ->
  if data.result
    data.result.map (repo) ->
      html.div
        className: 'repo-item'
        html.a
          className: 'name'
          href: repo.html_url
          repo.full_name
        html.div
          className: 'stars'
          repo.stargazers_count
  else if data.error
    html.div
      className: 'error'
      error.message
  else
    html.div
      className: 'loading'
