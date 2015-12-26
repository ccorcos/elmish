import flyd     from 'flyd'
import prop     from 'ramda/src/prop'
import raf      from 'raf'
import ReactDOM from 'react-dom'

const renderer = (effects$, throttle$) => {
  const root = document.getElementById('root')
  const html$ = flyd.map(prop('html'), effects$)
  flyd.on((html) => { 
    ReactDOM.render(html, root)
  }, html$)
}

export default renderer

