
cache = (ms, fn) ->
  (middleware, monitor) ->
    (effect$) ->
      fn()


http = (middleware, monitor) -> (effect$) ->
