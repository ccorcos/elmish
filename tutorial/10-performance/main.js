// this is a side-effect! we dont like this. what should we do?we need to bind funcitons
// and save them somewhere within the computation/heirarchy...

// I could LRU memoize everything since its pure, but I could also inject perfectly efficient
// memoization if I employ a good strategy.

// context is like a state. thats all. we just have to scan with it.

context = {}


context.child(id)
context.bind(dispatch, {type:'increment'})
context.call(declare, dispatch, state, context)


const childDispatch = (dispatch, id) => action => dispatch({type: 'child', action, id})

const declare = curry((dispatch, state, props, context) => {
  // wrap child actions with a child type

  const insert = context.bind(dispatch, {type: 'insert'})

  // we'll have insert and remove buttons wrapping each child item.
  return {
    html:
      h('div.list-of', [
        h('button.insert', { onClick: insert }, '+'),
        state.list.map((item) => {
          const d = context.call(childDispatch, dispatch, item.id)
          const fx = context.bind(kind.declare, d, item.state)

          kind.declare(d, item.state, {}, context).html,
          return (
            h('div.item', {key:item.id}, [
              fx.html,
              h('button.remove', {
                onClick: () => dispatch({type: 'remove', id: item.id})
              }, 'x')
            ])
          )
        })
      ])
  }
})