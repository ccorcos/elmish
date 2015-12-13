{simple, start, render, flyd} = require './elmish'

log = (label) -> (value) -> console.log(label+':', value)

renderToRoot = (html) ->
  render(html, document.getElementById('root'))

mount = ({html$, model$, action$}) ->
  flyd.map(renderToRoot, html$)
  flyd.map(log('model'), model$)
  flyd.map(log('action'), action$)

# ex1 - counter
Counter = require './simple/counter'
mount simple Counter

# # ex2 - list of counters
# Counter = require './simple/counter'
# listOf = require './simple/listOf'
# mount simple listOf Counter

# # ex3 - list of list of counters
# Counter = require './simple/counter'
# listOf = require './simple/listOf'
# mount simple listOf listOf Counter

# # ex4 - giphy with side-effects
# Giphy = require './giphy'
# mount start Giphy

# # ex5 - list of giphy with side-effects
# Giphy = require './giphy'
# listOf = require './listOf'
# mount start listOf Giphy

# # ex6 - undoable counter
# Counter = require './counter'
# undoable = require './undoable'
# mount start undoable Counter

# # ex7 - undoable list of counters
# Counter = require './counter'
# listOf = require './listOf'
# undoable = require './undoable'
# mount start undoable listOf Counter
