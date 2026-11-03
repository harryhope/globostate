# Globostate
Globostate is a [React hook](https://react.dev/reference/react/hooks) that creates a global, immutable state and allows you to read and update any part of it by using a path syntax similar to [lodash's](https://lodash.com) `_.get` and `_.set` functions.

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

`useGloboState` accepts two parameters. The first is the object path, written with dots and bracket indexes (`'lists.todos[0].title'`) or as an array of keys (`['lists', 'todos', 0, 'title']`). Updates are immutable: only the objects along that path are copied. The second is an initial state, similar to `useState`'s only parameter.

```js
const [todos, setTodos] = useGloboState('appState.lists.todos', [])
```

The default is returned whenever nothing is stored at the path yet. It isn't written into the store until you call the setter.

### Updater functions
Like `useState`, the setter also accepts a function. It receives the current value (or the default, if nothing is stored yet) and returns the next one:

```js
const [count, setCount] = useGloboState('app.count', 0)
setCount(c => c + 1)
```

Because a function passed to the setter is always treated as an updater, store a function by wrapping it: `setHandler(() => myFunction)`.

### Paths
- **Dots and brackets:** `'lists.todos[0].title'` and `'lists.todos.0.title'` are the same path.
- **Arrays of keys:** `['lists', 'todos', 0, 'title']`. Use this form when a key contains a dot or a bracket.
- **Creating missing levels:** when a set goes through a level that doesn't exist yet, globostate creates an array if the next key is a non-negative integer (`0`, `12`), and a plain object otherwise.
- **Not supported:** quoted keys such as `a["b"]`.

### Re-renders
A component re-renders only when the value at its path changes. Arrays and plain objects are compared shallowly, so setting an equal copy doesn't re-render. Everything else, including Dates, Maps, Sets and class instances, is compared by reference, so replace these values rather than mutating them.

### Separate stores
`Provider` and `useGloboState` share one store. To create an independent store, for example for a self-contained widget or library, call `createProvider`:

```js
import { createProvider } from 'globostate'

const { Provider: WidgetProvider, useGloboState: useWidgetState } = createProvider()
```

### Requirements
- React 18 or newer.
- globostate is published as an ES module. `import` works everywhere. Loading it with `require()` needs Node 20.19+ or 22.12+.

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
