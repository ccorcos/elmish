import flyd     from 'flyd'
import prop     from 'ramda/src/prop'
import ReactDOM from 'react-dom'

const render = (html) => ReactDOM.render(html, document.getElementById('root'))
const renderer = (effect$) => flyd.on(render, flyd.map(prop('html'), effect$))

export default renderer
