# TODO

- make a v13

- make React its own service with its own lazy, lift, and crawl/merge lifted children.

- note, children dont need to be lifted!

- crawl lifted subcomponents when a side-effect or publish/subscribe is not defined for that component
  - for dynamic children, you need to initialize the state yourself and have a \_lifted function that gets state and returns lifted components. whenever a function is prefixes with a \_, it means that it is unliftable. so for example, if you want to take charge of a component's children's update functions, you just define \_update instead of update and now you control all the actions for the subcomponents.

- publish / subscribe using lazy-tree
- hotkeys using lazy-tree
- http using lazy-tree
