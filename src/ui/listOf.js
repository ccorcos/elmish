import h from 'react-hyperscript'
import curry from 'ramda/src/curry'
import merge from 'ramda/src/merge'
import evolve from 'ramda/src/evolve'
import append from 'ramda/src/append'
import inc from 'ramda/src/inc'
import filter from 'ramda/src/filter'
import propEq from 'ramda/src/propEq'
import complement from 'ramda/src/complement'
import findIndex from 'ramda/src/findIndex'
import adjust from 'ramda/src/adjust'
import __ from 'ramda/src/__'
import map from 'ramda/src/map'
import keys from 'ramda/src/keys'
import mergeAllWith from 'src/utils/mergeAllWith'
import concat from 'ramda/src/concat'
import omit from 'ramda/src/omit'

const propNeq = complement(propEq)
const concatObjValues = mergeAllWith(concat)

// listOf : {init, update, declare} => {init, update, declare}
const listOf = (kind) => {

  const init = () => {
    return {list: [], nextId: 0}
  }

  const update = curry((state, action) => {
    switch (action.type) {
      case 'insert':
        const item = {
          id: state.nextId,
          state: kind.init()
        }
        return evolve({
          list: append(item),
          nextId: inc
        }, state)
      case 'remove':
        return evolve({
          list: filter(propNeq('id', action.id))
        }, state)
      case 'child':
        const idx = findIndex(propEq('id', action.id), state.list)
        return evolve({
          list: adjust(evolve({
            state: kind.update(__, action.action)
          }), idx)
        }, state)
      default:
        console.warn("Unknown action:", action)
        return state
    }
  })

  const declare = curry((dispatch, state) => {
    const childDispatch = id => action => dispatch({type: 'child', action, id})
    const getChildEffects = (item) =>
      kind.declare(childDispatch(item.id), item.state)

    const childEffects = map(getChildEffects, state.list)

    const childEffectsWithoutHtml = map(omit(['html']), childEffects)
    const nonHtmlEffects = concatObjValues(childEffectsWithoutHtml)

    return merge(nonHtmlEffects, {
      html:
        h('div.list-of', [
          h('button.insert', {
            onClick: () => dispatch({type: 'insert'})
          }, '+'),
          state.list.map((item, i) => {
            return (
              h('div.item', {key:item.id}, [
                childEffects[i].html,
                h('button.remove', {
                  onClick: () => dispatch({type: 'remove', id: item.id})
                }, 'x')
              ])
            )
          })
        ])
    })
  })
  return {init, update, declare}
}

export default listOf
