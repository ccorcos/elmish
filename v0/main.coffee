Counter = require('./counter')
listOf = require('./list')
{start} = require('./elmish')

# ex3
# start Counter
# ex4
start listOf(Counter)
# ex4+
# start listOf(listOf(Counter))
