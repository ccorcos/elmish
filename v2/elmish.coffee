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
  # accumulate model and effects after one action
  updateStep = (prev, action) ->
    next = config.update(action, prev.model)
    model: next.model
    effects: next.effects
  modelAndEffects = messages.startWith(config.init).scan(updateStep)
  model = modelAndEffects.map(prop('model'))
  effects = modelAndEffects.map(prop('effects'))
  # pipe all effects actions to the address
  tasks = effects.filter(truthy).subscribe (promises) -> promises.map (promise) -> 
    promise.then(address.onNext.bind(address)).catch(address.onNext.bind(address))
  html = model.map((instance) -> config.view(address.onNext.bind(address), instance))
  return {html, model, messages}

forwardTo = (next, func) -> (arg) ->
  next(if func then func(arg) else arg)

module.exports = {
  html: React.DOM
  render: ReactDOM.render
  start
  forwardTo
}