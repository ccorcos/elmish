import flyd from 'flyd'
import filter from 'flyd/module/filter'
import R from 'ramda'
import { computeEffect } from 'elmish/v16/elmish'
import { reduceLazyTree } from 'elmish/v16/lazy-tree'
import { effectEquals } from 'elmish/v16/utils/compare'

const keymap = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  224: 'meta',
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111 : '/',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: '\''
}

const aliases = {
  'delete': 'backspace',
  'cmd': 'meta',
  'control': 'ctrl',
}

// check if event came from an input element
const isInput = (e) => {
  const element = e.target || e.srcElement
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  )
}

const useHotkeysOverride = (e) => {
  const element = e.target || e.srcElement
  return element.className.indexOf('with-hotkeys') > -1
}

const modifierKeys = [
  'ctrl',
  'shift',
  'alt',
  'meta',
]

const isModifier = key => R.contains(key, modifierKeys)

const lookupEventKey = (e) =>  {
  const code = e.which || e.keyCode
  return keymap[code] || String.fromCharCode(code).toLowerCase()
}

// ignore modifier key events for two reasons:
// - for shortcuts like `cmd +` the keyup event will be skipped
// - the modifier keys are on the event anyways
const shouldCaptureHotkey = (e) => {
  if (isModifier(lookupEventKey(e))) {
    return false
  } else if (isInput(e)) {
    if (useHotkeysOverride(e)) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}

const addKey = (key, keys) => R.uniq(R.append(key, keys))
const removeKey = (key, keys) => R.filter(R.complement(R.equals(key)), keys)
const formatKeys = keys => keys.sort().join(' ')
const translateAliases = k => (aliases[k] || k)
const formatHotkeyStr = def => formatKeys(def.split(' ').map(translateAliases))

const mapKeys = R.curry((fn, obj) => {
  const obj2 = {}
  Object.keys(obj).forEach(key => {
    obj2[fn(key)] = obj[key]
  })
  return obj2
})

const formatHotkeyDef = mapKeys(formatHotkeyStr)

const getModifiers = e => {
  const mods = []
  if (e.ctrlKey) {
    mods.push('ctrl')
  }
  if (e.altKey) {
    mods.push('alt')
  }
  if (e.shiftKey) {
    mods.push('shift')
  }
  if (e.metaKey) {
    mods.push('meta')
  }
  return mods
}

const combineFunctions = (a, b) => (...args) => {
  a(...args)
  b(...args)
}

const driver = (app, dispatch) => {

  let keys = []
  let listeners = {}
  let computation = undefined

  document.addEventListener('keydown', (e) => {
    if (shouldCaptureHotkey(e)) {
      const key = lookupEventKey(e)
      keys = addKey(key, keys)

      const hotkey = formatKeys(keys.concat(getModifiers(e)))
      // console.log(hotkey)
      const callback = listeners[hotkey]
      if (callback) {
        e.preventDefault()
        e.stopPropagation()
        callback()
        // keyup only fires *after* the default action has been performed
        // http://www.quirksmode.org/dom/events/keys.html
        keys = removeKey(key, keys)
      }
    }
  })

  document.addEventListener('keyup', (e) => {
    if (shouldCaptureHotkey(e)) {
      const key = lookupEventKey(e)
      keys = removeKey(key, keys)
    }
  })

  return state => {
    const computeHotkeys = computeEffect('hotkeys', app)
    const tree = computeHotkeys({state, dispatch})

    computation = reduceLazyTree(effectEquals, (a,b) => {
      return R.mergeWith(combineFunctions, a, b)
    }, computation, tree)

    listeners = formatHotkeyDef(computation.result)
  }
}

export default driver
