import flyd from 'flyd'
import R from 'ramda'

// services is Map {name: {connect, lift}} of side-effect drivers.
//
const elmish = (services) => ({
  creator: (transforms) => (component) => {
    const applyServices = (fn) => fn(services)
    const applyTransform = (x, fn) => fn(x)
    return R.pipe(
      R.map(applyServices),
      R.reduce(applyTransform, component),
      R.evolve({ update: R.curry }),
      R.assoc('_elmish', true)
    )(transforms)
  },
  start: (app) => {
    const action$ = flyd.stream()
    // flyd.map(log('action'), action$)
    const state$ = flyd.scan(R.flip(app.update), app.init(), action$)
    // no we'll connect to each service
    const stateAndPub$ = flyd.map(state => {
      return {
        state,
        pub: app.publish(action$, state)
      }
    }, state$)
    // flyd.map(log('state + pub'), stateAndPub$)
    Object.keys(services).map(name => {
      const declare$ = flyd.map(({state, pub}) => {
        return R.curry(app[name])(action$, state, pub)
      }, stateAndPub$)
      // RUN SIDE-EFFECTS!!!
      services[name].connect(declare$)
    })
  }
})

export default elmish
