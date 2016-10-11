import React from 'react'

const Counter = {
  init: () => 0,
  update: (state, action) => state + action,
  view: (dispatch, state) => (
    <div>
      <button onClick={() => dispatch(-1)}>{'-'}</button>
      <span>{state}</span>
      <button onClick={() => dispatch(+1)}>{'+'}</button>
    </div>
  ),
}

export default Counter
