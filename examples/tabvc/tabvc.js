/*
- how do we separate the concept of the tabs from the tabbar?
- how to we animate the tabbar if we want to?
- how do we animate the tab transition if we want to?
- we dont want to use css transtions or anything stateful...

think about different types of tab view controller setups
- carosel with animation
  - arrows inside each tab
  - arrows outside the tabvc
- a simple ios tabvc
- a desktop navbar tabvc

its not to hard to make any one of these but really hard to
abstract it all into one component.
the hard parts are:
- different animations
- triggering tab change from different places (parent or child)
- animating the tabs and the tabbar separately
- different props somehow needs to trigger update so when we change tabs
  we can pass it as props to the tabbar but also start an animation. this
  means you'll have to keep the tabbar state in sync with the tabbar props
  which is annoyoing but at least you'll be able to animate it. thats not
  possible though...


for now, lets make a simple tabvc which controls the tabbar. this saves us
from a lot of problem.
- then animate
- then routing
- then responsive

*/

import h from 'react-hyperscript'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import reduce from 'ramda/src/reduce'
import __ from 'ramda/src/__'
import evolve from 'ramda/src/evolve'
import adjust from 'ramda/src/adjust'
import concat from 'ramda/src/concat'

const styles = {
  tabvc: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
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

const tabvc = (tabs, names) => {

  const init = () => {
    return {
      tab: 0,
      states: tabs.map(tab => tab.init()),
      animations: []
    }
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'change_tab':
        return merge(state, {
          tab: action.tab
        })
      case 'child':
        return evolve({
          states: adjust(action.tab, tabs[action.tab].update(__, action.action))
        }, state)
      default:
        return state
    }
  })

  const declare = curry((dispatch, state) => {

    const childDispatch = (action) => dispatch({type:'child', tab: state.tab, action})
    const changeTab = (tab) => () => dispatch({'type': 'change_tab', tab})
    const effects = tabs[state.tab].declare(childDispatch, state.states[state.tab])
    const makeHotkey = (name, i) => ({[`${i+1}`]: changeTab(i)})
    const hotkeys = reduce(merge, {}, names.map(makeHotkey))
    const renderTab = (name, i) => {
      return h('div.tab', {
        onClick: changeTab(i),
        style: (state.tab === i) ? merge(styles.tab, {fontWeight:'bold'}) : styles.tab
      }, name)
    }

    return merge(effects, {
      html:
        h('div.tabvc', {style: styles.tabvc}, [
          effects.html,
          h('div.tabbar', {style: styles.tabbar}, names.map(renderTab))
        ]),
      hotkeys: concat(effects.hotkeys || [], [hotkeys])
    })
  })

  return {init, declare, update}
}

export default tabvc
