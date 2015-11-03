{html, flyd, Req, bind, R, inspect} = require './elmish'

# make sure the promised action makes it back to the child
toChildAction = (id) -> (action) -> {type: 'child', id, action}

# wrap all child requests
childRequests = ({id, child:{requests}}) ->
  R.map(Req.map(toChildAction(id)), requests)

# concat all child requetss together
concatRequests = R.map (state) ->
  state: state
  requests: R.reduce(Req.concat, [], R.map(childRequests, state.list))

insert = (state, child) ->
  id = state.nextId
  list: [{id, child}].concat(state.list)
  nextId: state.nextId + 1

remove = (state, id) ->
  list: state.list.filter (item) -> item.id isnt id
  nextId: state.nextId

updateChild = (state, id, action, update) ->
  list: state.list.map (item) ->
    if item.id is id
      return {id, child: update(item.child.state, action)}
    else
      return item
  nextId: state.nextId

# kind = {init, view, update}
listOf = (kind) ->

  # init : () -> {state, requests}
  init = concatRequests () -> {list: [], nextId: 0}

  # update : (state, action) -> {state, requests}
  update = concatRequests (state, action) ->
    switch action.type
      when 'insert' then return insert(state, kind.init())
      when 'remove' then return remove(state, action.id)
      when 'child' then return updateChild(state, action.id, action.action, kind.update)
      else return state

  # view : (dispatch, state) -> html
  view = (dispatch, state) ->
    html.div {},
      html.button
        onClick: bind([{type:'insert'}], dispatch)
        '+'
      state.list.map (item) ->
        html.div {},
          kind.view(R.pipe(toChildAction(item.id), dispatch), item.child.state)
          html.button
            onClick: bind([{type: 'remove', id: item.id}], dispatch)
            'X'

  return {init, update, view}

module.exports = listOf
