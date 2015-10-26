Gif = require('./gif')
listOf = require('./list')
{start, render} = require('./elmish')

start listOf(Gif)
# start listOf(listOf(Gif))


# {init, view, update} = listOf(listOf(Gif))
# actions = [{"type":"insert"},{"type":"child","id":0,"action":{"type":"insert"}},{"type":"child","id":0,"action":{"type":"child","id":0,"action":{"type":"newGif","url":"http://media.giphy.com/media/2DUHNiju3Q6ys/giphy.gif"}}},{"type":"child","id":0,"action":{"type":"child","id":0,"action":{"type":"anotherGif"}}},{"type":"child","id":0,"action":{"type":"child","id":0,"action":{"type":"newGif","url":"http://media.giphy.com/media/OH0j0P676aqXu/giphy.gif"}}},{"type":"child","id":0,"action":{"type":"insert"}},{"type":"child","id":0,"action":{"type":"child","id":1,"action":{"type":"newGif","url":"http://media.giphy.com/media/2GFjK58cd92yQ/giphy.gif"}}},{"type":"child","id":0,"action":{"type":"child","id":1,"action":{"type":"anotherGif"}}},{"type":"child","id":0,"action":{"type":"child","id":1,"action":{"type":"newGif","url":"http://media1.giphy.com/media/jQXFA8fAo7eGk/giphy.gif"}}}]
# reducer = (model, action) -> update(action, model).model
# model = actions.reduce(reducer, init().model)
# init = -> {model}
# start {init, view, model}
