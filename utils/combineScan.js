// import flyd from 'flyd'

// const combineScan = flyd.curryN(2, (f, acc, deps) => {
  
//   const ns = flyd.combine(() => {
//     const changed = arguments[argument.length - 1]
//     const self = arguments[argument.length - 2]
//     acc = f(acc, deps.map(s => s()), changed)
//     self(acc)
//   }, deps)

//   if (!ns.hasVal) { ns(acc) }
//   return ns
// })

// export default combineScan