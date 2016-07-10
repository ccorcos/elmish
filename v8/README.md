
A basic component like a counter.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  effect: actions -> state -> props -> *
}

A component like an input where you need to transform actions like `e.target.value`

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  actions: {
    type: * -> action
  },
  effect: actions -> state -> props -> *
}

A component that publishes information, like a cache or some other global information.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  publish: action -> state -> props -> pub,
  effect: actions -> state -> props -> *
}

A component that subscribes to published data. Like a modal window.

component :: {
  init: () -> state,
  update: {
    type: state -> action -> state
  },
  subscribe: state -> props -> lens,
  effect: actions -> state -> pub -> props -> *
}

A basic component with sub components

component :: {
  schema :: {
    name: component
  }
}



component :: {
  init: () -> state,
  schema :: state -> {field: {type, lens}}
}