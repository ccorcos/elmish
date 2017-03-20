import React from 'react'
import ReactDOM from 'react-dom'
import { css } from 'glamor'

const style = css({
  color: 'blue'
})

class Index extends React.PureComponent {
  render() {
    return (
      <div className={style}>
        Hello World!
      </div>
    )
  }
}

const root = document.createElement('div')
document.body.appendChild(root)

ReactDOM.render(<Index/>, root)
