html = require('react').DOM

fetch = (id) ->
  ['tweets', {id}, ['text', 'username', 'time']]

view = (tweets) ->
  if tweets
    tweets.map (tweet) ->
      html.div
        className: 'tweet-item'
        html.div
          className: 'username'
          tweet.username
        div.html
          className: 'text'
          tweet.text
  else
    html.div
      className: 'loading'
