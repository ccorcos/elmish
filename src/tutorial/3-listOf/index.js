import React from 'react'
import start from '../2-twoOf/elmish'
import Counter from '../2-twoOf/counter'

const listOf = kind => ({
  init: () => ({
    id: 1,
    list: [{
      id: 0,
      state: kind.init(),
    }],
  }),
  update: (state, action) => {
    if (action.type === 'insert') {
      return {
        id: state.id + 1,
        list: state.list.concat([{
          id: state.id,
          state: kind.init(),
        }]),
      }
    }
    if (action.type === 'remove') {
      return {
        id: state.id,
        list: state.list.filter(item => item.id !== action.id),
      }
    }
    if (action.type === 'item') {
      return {
        id: state.id,
        list: state.list.map(item => {
          if (item.id === action.id) {
            return {
              id: item.id,
              state: kind.update(item.state, action.action)
            }
          }
          return item
        }),
      }
    }
  },
  view: (dispatch, state) => (
    <div>
      <button onClick={() => dispatch({type: 'insert'})}>insert</button>
      {state.list.map(item => (
        <div key={item.id}>
          {kind.view(
            action => dispatch({type: 'item', id: item.id, action}),
            item.state
          )}
          <button onClick={() => dispatch({type: 'remove', id: item.id})}>remove</button>
        </div>
      ))}
    </div>
  ),
})

start(listOf(Counter))
// start(listOf(listOf(Counter)))
