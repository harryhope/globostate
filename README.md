# Globostate
Globostate is a [React hook](https://react.dev/reference/react/hooks) that creates a global, immutable state and allows you to manipulate that state using [lodash's](https://lodash.com) `_.get` and `_.set` functions.

**Here's what it looks like:**
```js
const ExampleComponent = ()  => {
  const [count, setCount] = useGloboState('app.components.counterValue', 0)
  return (
    <main>
      <p>You clicked {count} times.</p>
      <button onClick={() => setCount(count + 1)}>Click Me</button>
    </main>
  )
}
```

## Getting Started
Globostate requires React as a peer dependency. To get started:
```
npm i react react-dom globostate
```

### The Provider
Globostate includes a `Provider` component that must wrap your application:

```js
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useGloboState } from 'globostate'

const container = document.getElementById('app')
const root = createRoot(container)

root.render(
  <Provider>
    <App />
  </Provider>
)
```

### The Hook
The `useGloboState` hook works very similarly to React's `useState` hook but global state can be accessed anywhere in the application without drilling down state through props.

`useGloboState` accepts two parameters. The first is the object path. Under the hood globostate uses lodash's `_.get` and `_.set` functions to modify parts of the global object. The second is an initial state, similar to `useState`'s only parameter.

```js
const [todos, setTodos] = useGloboState('appState.lists.todos', [])
```

### Putting it all together
Here is what a full app might look like:

```js
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useGloboState } from 'globostate'

const App = () => {
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
```