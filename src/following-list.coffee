html = require('react').DOM

userItem = require('src/user-item')

# request a query for who's following this user.
effect = (state) ->
  {$github: ['following', {limit: 20}, userItem.fields()]}
  
view = ({selected, select, data}) ->
  if data.following.$pending
    html.div
      className: 'loading'
  else if data.following
    data.following.map (user) ->
      html.div
        className: 'user-item' + (if user.id is selected then ' selected' else '')
        onClick: -> select(user.id)
        userItem.view(user)
  else if data.error
    html.div
      className: 'error'
      error.message    
  else
    console.warn("shouldn't be here")

module.exports = {effect, view}
