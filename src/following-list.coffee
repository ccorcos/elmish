html = require('react').DOM

userItem = require('src/user-item')

# request a query for who's following this user.
fetch = (state) ->
  ['following', {limit: 20}, userItem.fields()]

view = ({selected, select, users}) ->
  if users
    users.map (user) ->
      html.div
        className: 'user-item' + (if user.id is selected then ' selected' else '')
        onClick: -> select(user.id)
        userItem.view(user)
  else
    html.div
      className: 'loading'
