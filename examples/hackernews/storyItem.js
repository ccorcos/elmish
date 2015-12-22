import h       from 'react-hyperscript'
import curry   from 'ramda/src/curry'

const declare =  {
  html: (data) => {
    return (
      h('div.story', [
        h('div.title', [
          h('a', {href: data.url}, data.title)
        ]),
        h('div.author', `by ${data.by.id}`)
      ])
    )
  },
  fragment: `
    title
    url
    by {
      id
    }
  `
}


export default {declare}
