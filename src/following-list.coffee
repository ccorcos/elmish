html = require('react').DOM

userItem = require('src/user-item')

# request a query for who's following this user.
fetch = (state) ->
  {$github: ['following', {limit: 20}, userItem.fields()]}
  
view = ({selected, select, data}) ->
  if data.result
    data.result.map (user) ->
      html.div
        className: 'user-item' + (if user.id is selected then ' selected' else '')
        onClick: -> select(user.id)
        userItem.view(user)
  else if data.error
    html.div
      className: 'error'
      error.message
  else
    html.div
      className: 'loading'
