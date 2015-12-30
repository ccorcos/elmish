
import h from 'react-hyperscript'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import reduce from 'ramda/src/reduce'
import __ from 'ramda/src/__'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import concat from 'ramda/src/concat'

const styles = {
  tabbar: {
    flex: '0 0 50px',
    display: 'flex',
    flexDirection: 'row',
  },
  tab: {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}

const tabbar = (names) => {

  const init = () => {}
  const update = curry((state, action) => state)

  const declare = curry((dispatch, state, {index, change}) => {

    const makeHotkey = (name, i) => ({[`${i+1}`]: () => change(i)})
    const hotkeys = reduce(merge, {}, names.map(makeHotkey))

    const renderTab = (name, i) => {
      return h('div.tab', {
        onClick: () => change(i),
        style: (index === i) ? merge(styles.tab, {fontWeight:'bold'}) : styles.tab
      }, name)
    }

    return {
      html: h('div.tabbar', {style: styles.tabbar}, names.map(renderTab)),
      hotkeys: [ hotkeys ]
    }
  })

  return {init, declare, update}
}

export default tabbar
