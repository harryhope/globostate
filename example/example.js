import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useGloboState } from '../index'

const App = props => {
  const [value, updateValue] = useGloboState('app.counterValue', 0)
  return (
    <main>
      <div><button onClick={() => updateValue(value - 1)}>-</button></div>
      <div>{value}</div>
      <div><button onClick={() => updateValue(value + 1)}>+</button></div>
    </main>
  )
}

const container = document.getElementById('app')
const root = createRoot(container)

root.render(
  <Provider>
    <App />
  </Provider>
)
