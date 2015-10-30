R = require 'ramda'

bind = (f, args=[]) ->
  bound = (moreArgs...) -> f.apply(null, R.concat(args, moreArgs))
  bound.func = (f.func or f)
  bound.args = R.concat((f.args or []), args)
  bound.equals = (g) ->
    R.equals((g?.args or []), bound.args) and R.equals((g?.func or g), bound.func)
  return bound

# add = (a, b) -> a + b
# _add = bind add, []

# _add1 = bind add, [1]
# add1 = bind add, [1]

# three = bind add1, [2]
# _three = bind _add1, [2]

# console.log add1.equals(_add1), R.equals(add1, _add1), _add1.equals(add1), R.equals(_add1, add1), add1(10) is _add1(10)
# console.log three.equals(_three), R.equals(three, _three)
# console.log _add.equals(add), R.equals(add, _add), R.equals(_add, add)
