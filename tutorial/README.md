

init    : () -> state
update  : (state, action) -> state
effects : (dispatch, state) -> fx

- update and effects must be auto curried!
