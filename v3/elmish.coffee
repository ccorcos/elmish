# https://github.com/Reactive-Extensions/RxJS/issues/992

# need to worry about hot vs cold observables.  


# https://github.com/evancz/start-app/blob/2.0.1/src/StartApp.elm

React = require 'react'
ReactDOM = require 'react-dom'
Rx = require 'rx-lite'
require 'whatwg-fetch' # window.fetch polyfill 

prop = (key) -> (obj) -> obj[key]
truthy = (x) -> x?

# config = {init:{model, effects}, update, view, inputs=[]}
# inputs is an array of observables that emit actions.
start = (config) ->
  # address view actions
  address = new Rx.Subject()
  
  # all actions, external and internal
  messages = Rx.Observable.merge((config.inputs or []).concat(address))
  
  updateStep = (prev, action) ->
    console.log "UPDATE"
    next = config.update(action, prev.model)
    model: next.model
    effects: next.effects
  
  modelAndEffects = messages.startWith(config.init).scan(updateStep)

  model = modelAndEffects.map(prop('model'))
  effects = modelAndEffects.map(prop('effects'))


  # pipe all effects actions to the address
  tasks = effects.filter(truthy).subscribe (promises) ->
    promises.map (promise) -> 
      console.log "PROMISE"
      promise.then(address.onNext.bind(address)).catch(address.onNext.bind(address))
  
  html = model.map (instance) -> 
    console.log "RENDER"
    config.view(address.onNext.bind(address), instance)
  return {html, model, messages}

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  start
}