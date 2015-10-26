Gif = require('./gif')
listOf = require('./list')
{start, render} = require('./elmish')

{init, update, view} = listOf(Gif)
{html, model, messages} = start({init: init(), update, view})

# render html and run tasks
html.subscribe (tree) -> render(tree, document.getElementById('root'))


Rx = require('rx-lite')

# logger = Rx.Observable.merge(
#   model.map (x) ->    "model:   #{JSON.stringify(x)}" 
#   messages.map (x) -> "message: #{JSON.stringify(x)}"
# ).subscribe(console.log.bind(console))
