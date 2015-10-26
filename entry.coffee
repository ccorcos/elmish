{simple, start} = require './elmish'

# ex1 - counter
Counter = require './simple/counter'
simple Counter

# # ex2 - list of counters
# Counter = require './simple/counter'
# listOf = require './simple/list'
# simple listOf(Counter)

# # ex3 - list of list of counters
# Counter = require './simple/counter'
# listOf = require './simple/list'
# simple listOf(listOf(Counter))

# # ex4 - giphy with side-effects
# Giphy = require './giphy'
# start Giphy

# # ex5 - list of giphy with side-effects
# Giphy = require './giphy'
# listOf = require './list'
# start listOf(Giphy)