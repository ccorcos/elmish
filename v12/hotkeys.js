import flyd from 'flyd'
import filter from 'flyd/module/filter'
import R from 'ramda'

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

const shouldCaptureHotkeys = (e) => {
  if (isInput(e)) {
    if (useHotkeysOverride(e)) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}

const lookupEventKey = (e) =>  {
  const code = e.which || e.keyCode
  return keymap[code] || String.fromCharCode(code).toLowerCase()
}

const keydown$ = flyd.stream()
const keyup$ = flyd.stream()

document.addEventListener('keydown', keydown$)
document.addEventListener('keyup', keyup$)

// flyd.on(console.log.bind(console), keyup$)

const action$ = flyd.merge(
  R.pipe(
    filter(shouldCaptureHotkeys),
    flyd.map(event => ({event, key: lookupEventKey(event)})),
    flyd.map(R.assoc('action', 'keydown'))
  )(keydown$),
  R.pipe(
    // filter(shouldCaptureHotkeys),
    flyd.map(event => ({event, key: lookupEventKey(event)})),
    flyd.map(R.assoc('action', 'keyup'))
  )(keyup$)
)

const addKey = (key, keys) => R.uniq(R.append(key, keys))
const removeKey = (key, keys) => R.filter(R.complement(R.equals(key)), keys)

const state$ = flyd.scan(({keys}, {action, event, key}) => {
  if (action === 'keyup') {
    return {
      event,
      action,
      keys: removeKey(key, keys),
    }
  } else if (action === 'keydown') {
    return {
      event,
      action,
      keys: addKey(key, keys),
    }
  }
}, {keys: []}, action$)

const formatKeys = keys => keys.sort().join(' ')

// dont want to trigger hotkeys on keyup events
const hotkey$ = R.pipe(
  filter(R.propEq('action', 'keydown')),
  flyd.map(R.evolve({keys: formatKeys}))
)(state$)

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

const driver = (app, dispatch, batch) => {
  const listener$ = flyd.stream({})

  flyd.on(({keys, event}) => {
    const callback = listener$()[keys]
    if (callback) {
      console.log(keys)
      event.preventDefault()
      event.stopPropagation()
      callback()
    }
  }, hotkey$)

  const setListeners = R.compose(listener$, formatHotkeyDef)
  return (state, pub) => setListeners(app.hotkeys(dispatch, state, pub))
}

export default driver
