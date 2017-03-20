import h from "snabbdom/h";

const Counter = {
  stateful: {
    init: () => 0,
    update: ({ state, action }) => state + action
  },
  handlers: {
    inc: ({ props, state }) => event => +1,
    dec: ({ props, state }) => event => props.decBy
  },
  view: ({ handlers, state, props }) =>
    h("div", [
      h("button", { on: { click: handlers.dec } }, "-"),
      h("span", state.toString()),
      h("button", { on: { click: handlers.inc } }, "+")
    ])
};

// We should try to use modules / services for everything, just like snabbdom works.

// What if we had a `patch` function for component themselves?
