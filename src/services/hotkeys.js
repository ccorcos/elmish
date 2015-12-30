/*
This hotkey service takes objects of the form {hotkey:callback}. The hotkey
string needs to be space-separated hotkey descriptors like "cmd d" or
"alt shift 4". Notice that "shift" and "4" doesn't mean "$" so make sure your
descriptors only reference basic keys without modifiers.
*/

import flyd from 'flyd'

import complement from 'ramda/src/complement'
import uniq from 'ramda/src/uniq'
import append from 'ramda/src/append'
import filter from 'ramda/src/filter'
import equals from 'ramda/src/equals'
import prop from 'ramda/src/prop'
import map from 'ramda/src/map'
import reduce from 'ramda/src/reduce'
import mergeWith from 'ramda/src/mergeWith'

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

const hotkeyListener = (effect$, throttle$) => {

  let keys = []
  let listeners = {}

  const addKey = (key) => {
    keys = uniq(append(key, keys))
  }

  const removeKey = (key) => {
    keys = filter(complement(equals(key)), keys)
  }

  const lookupEventKey = (e) =>  {
    const code = e.which || e.keyCode
    return keymap[code] || String.fromCharCode(code).toLowerCase()
  }

  const isInput = (e) => {
    const element = e.target || e.srcElement
    if (element.className.indexOf('with-hotkeys') > -1) { return false }
    return element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || element.isContentEditable
  }

  const currentHotkey = () => {
    return keys.sort().join(' ')
  }

  const translateHotkeyStr= (str) => {
    return str.split(' ')
      .map((k) => aliases[k] || k)
      .sort()
      .join(' ')
  }

  const translateHotkeyListeners = (obj) => {
    let l = {}
    Object.keys(obj).map((k) => {
      l[translateHotkeyStr(k)] = obj[k]
    })
    return l
  }

  const concatFuncs = (a, b) => {
    return () => {
      a()
      b()
    }
  }

  const mergeAllHotkeys = (list) => {
    return reduce(mergeWith(concatFuncs), {}, list)
  }

  document.addEventListener('keydown', (e) => {
    if (isInput(e)) { return }
    const key = lookupEventKey(e)
    addKey(key)
    const hotkey = currentHotkey()
    const callback = listeners[hotkey]
    if (callback) {
      e.preventDefault()
      e.stopPropagation()
      // there may be multiple listeners for the same hotkey
      // so make sure to throttle so we dont re-render unnecessarily
      throttle$(true)
      callback(hotkey)
      throttle$(false)
      // keyup only fires *after* the default action has been performed
      // http://www.quirksmode.org/dom/events/keys.html
      removeKey(key)
    }
  })

  document.addEventListener('keyup', (e) => {
    if (isInput(e)) { return}
    const key = lookupEventKey(e)
    removeKey(key)
  })

  const setListeners = (l=[]) => {
    listeners = mergeAllHotkeys(map(translateHotkeyListeners, l))
  }

  const hotkeys$ = flyd.map(prop('hotkeys'), effect$)

  flyd.on(setListeners, hotkeys$)
}

export default hotkeyListener
