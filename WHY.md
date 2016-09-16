# Evaluating JavaScript Frameworks
## In Search of the HolyGrail.js

- simplicity
  - with the right abstractions, you should be able to do any one thing in about 100 lines of code
- purity
- immutability
- no markup
- abstraction
  - declarative, composable, encapsulated
  - build a counter component (or entire app) and reuse it
  - arbitrary listOf component
  - undoable / time travel component
    - declarative side-effect (no transient states!)
- decoupled data model
  - two counters with the same state
  - two counters with different state
  - control of one component from another
    - view the counter value, change the counter value from anywhere
