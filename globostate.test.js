/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, fireEvent, getNodeText } from '@testing-library/react'
import { Provider, useGloboState } from './index'

const Counter = () => {
  const [value, updateValue] = useGloboState('app.counterValue', 0)
  const [, updateAll] = useGloboState('app', {})
  return (
    <main>
      <div><button data-testid='deincrement' onClick={() => updateValue(value - 1)}>-</button></div>
      <div data-testid='countervalue'>{value}</div>
      <div><button data-testid='increment' onClick={() => updateValue(value + 1)}>+</button></div>
      <div><button data-testid='set' onClick={() => updateAll({ counterValue: 42 })}>Set to 42</button></div>
    </main>
  )
}

const TodoList = () => {
  const [list, updateList] = useGloboState('list', ['milk'])

  const mutateList = () => {
    list.push('eggs')
    list.push('bread')
    list.push('taters')
    updateList(list)
  }

  return (
    <main>
      <div data-testid='list'>
        {list.map(item => `${item},`)}
        ...
      </div>
      <button
        data-testid='add'
        onClick={mutateList}
      />
      <button
        data-testid='replace'
        onClick={() => updateList(['cookies', 'candy', 'cheese whiz'])}
      />
    </main>
  )
}

const AddressBook = () => {
  const [fields, updateFields] = useGloboState('fields.user1', {
    first: 'Darth',
    last: 'Vader',
    planet: 'Hoth'
  })

  const updateAll = () => {
    updateFields({ ...fields, last: 'Maul', password: 12345 })
  }

  return (
    <main>
      <div data-testid='details'>{fields.first} {fields.last} {fields.planet} {fields.password}</div>
      <button data-testid='update' onClick={updateAll}>Update</button>
    </main>
  )
}

describe('Globostate', () => {
  it('should increment and deincrement a counter', () => {
    const App = () =>
      <Provider>
        <Counter />
      </Provider>

    const { getByTestId } = render(<App />)

    const counter = getByTestId('countervalue')
    const increment = getByTestId('increment')
    const deincrement = getByTestId('deincrement')
    const set = getByTestId('set')

    expect(getNodeText(counter)).toBe('0')
    fireEvent.click(increment)
    expect(getNodeText(counter)).toBe('1')
    fireEvent.click(increment)
    expect(getNodeText(counter)).toBe('2')
      ;[1, 2, 3].forEach(() => fireEvent.click(deincrement))
    expect(getNodeText(counter)).toBe('-1')
    fireEvent.click(set)
    expect(getNodeText(counter)).toBe('42')
    fireEvent.click(increment)
    expect(getNodeText(counter)).toBe('43')
  })
  it('should allow immutable updates on arrays', () => {
    const App = () =>
      <Provider>
        <TodoList />
      </Provider>

    const { getByTestId } = render(<App />)

    const list = getByTestId('list')
    const addItems = getByTestId('add')
    const replaceItems = getByTestId('replace')

    expect(getNodeText(list)).toBe('milk,...')
    fireEvent.click(addItems)
    // expect(getNodeText(list)).toBe('milk,eggs,bread,taters,...')
    fireEvent.click(replaceItems)
    expect(getNodeText(list)).toBe('cookies,candy,cheese whiz,...')
  })
  it('should predictably update objects', () => {
    const App = () =>
      <Provider>
        <AddressBook />
      </Provider>

    const { getByTestId } = render(<App />)

    const details = getByTestId('details')
    const update = getByTestId('update')

    expect(getNodeText(details)).toBe('Darth Vader Hoth ')
    fireEvent.click(update)
    expect(getNodeText(details)).toBe('Darth Maul Hoth 12345')
  })
  it('should not rerender when setting the same value', () => {
    let renderCount = 0

    const ComponentWithRenderTracking = () => {
      const [value, setValue] = useGloboState('sameValue', 'initial')
      renderCount++
      return (
        <div>
          <div data-testid='render-count'>{renderCount}</div>
          <div data-testid='value'>{value}</div>
          <button data-testid='set-same' onClick={() => setValue('initial')}>Set Same</button>
          <button data-testid='set-different' onClick={() => setValue('changed')}>Set Different</button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithRenderTracking />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    // Initial render
    expect(getByTestId('render-count').textContent).toBe('1')
    expect(getByTestId('value').textContent).toBe('initial')

    // Setting the same value should not cause a rerender
    fireEvent.click(getByTestId('set-same'))
    expect(getByTestId('render-count').textContent).toBe('1') // Should not rerender
    expect(getByTestId('value').textContent).toBe('initial')

    // Setting a different value should cause a rerender
    fireEvent.click(getByTestId('set-different'))
    expect(getByTestId('render-count').textContent).toBe('2') // Should rerender
    expect(getByTestId('value').textContent).toBe('changed')

    // Setting the same value again should not cause a rerender
    fireEvent.click(getByTestId('set-different'))
    expect(getByTestId('render-count').textContent).toBe('2') // Should not rerender
    expect(getByTestId('value').textContent).toBe('changed')
  })

  it('should not rerender when setting shallowly equal objects', () => {
    let renderCount = 0

    const ComponentWithObjectState = () => {
      const [obj, setObj] = useGloboState('objectState', { name: 'John', age: 30 })
      renderCount++
      return (
        <div>
          <div data-testid='render-count'>{renderCount}</div>
          <div data-testid='object-content'>{obj.name} - {obj.age}</div>
          <button
            data-testid='set-same-object'
            onClick={() => setObj({ name: 'John', age: 30 })}
          >
            Set Same Object
          </button>
          <button
            data-testid='set-different-object'
            onClick={() => setObj({ name: 'Jane', age: 25 })}
          >
            Set Different Object
          </button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithObjectState />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    // Initial render
    expect(getByTestId('render-count').textContent).toBe('1')
    expect(getByTestId('object-content').textContent).toBe('John - 30')

    // Setting a shallowly equal object should not cause a rerender
    fireEvent.click(getByTestId('set-same-object'))
    expect(getByTestId('render-count').textContent).toBe('1') // Should not rerender
    expect(getByTestId('object-content').textContent).toBe('John - 30')

    // Setting a different object should cause a rerender
    fireEvent.click(getByTestId('set-different-object'))
    expect(getByTestId('render-count').textContent).toBe('2') // Should rerender
    expect(getByTestId('object-content').textContent).toBe('Jane - 25')

    // Setting the same object again should not cause a rerender
    fireEvent.click(getByTestId('set-different-object'))
    expect(getByTestId('render-count').textContent).toBe('2') // Should not rerender
    expect(getByTestId('object-content').textContent).toBe('Jane - 25')
  })

  it('should throw an error if used outside of a Provider', () => {
    const App = () => {
      try {
        useGloboState('app.counterValue', 0)
      } catch (err) {
        return <div data-testid='error'>{err.message}</div>
      }
    }

    const { getByTestId } = render(<App />)

    expect(getNodeText(getByTestId('error'))).toBe('useGloboState must be used within a Provider')
  })

  it('should allow setting state via an array path', () => {
    const ComponentWithArrayPath = () => {
      const [value, setValue] = useGloboState(['nested', 'path', 'to', 'value'], 'default')
      return (
        <div>
          <div data-testid='value'>{value}</div>
          <button data-testid='set-value' onClick={() => setValue('updated')}>Set Value</button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithArrayPath />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    const valueDiv = getByTestId('value')
    const setValueButton = getByTestId('set-value')

    expect(getNodeText(valueDiv)).toBe('default')
    fireEvent.click(setValueButton)
    expect(getNodeText(valueDiv)).toBe('updated')
  })

  it('should not rerender components when unrelated state changes', () => {
    let counterRenders = 0
    let todoRenders = 0

    const CounterWithRenderTracking = () => {
      const [value, updateValue] = useGloboState('app.counterValue', 0)
      counterRenders++
      return (
        <div>
          <div data-testid='counter-renders'>{counterRenders}</div>
          <div data-testid='counter-value'>{value}</div>
          <button data-testid='increment-counter' onClick={() => updateValue(value + 1)}>+</button>
        </div>
      )
    }

    const TodoWithRenderTracking = () => {
      const [list, updateList] = useGloboState('todoList', [])
      todoRenders++
      return (
        <div>
          <div data-testid='todo-renders'>{todoRenders}</div>
          <div data-testid='todo-count'>{list.length}</div>
          <button data-testid='add-todo' onClick={() => updateList([...list, 'new item'])}>Add Todo</button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <CounterWithRenderTracking />
        <TodoWithRenderTracking />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    // Initial render: both components should render once
    expect(getByTestId('counter-renders').textContent).toBe('1')
    expect(getByTestId('todo-renders').textContent).toBe('1')

    // Update counter - only counter component should rerender
    fireEvent.click(getByTestId('increment-counter'))
    expect(getByTestId('counter-renders').textContent).toBe('2')
    expect(getByTestId('todo-renders').textContent).toBe('1') // Should not rerender
    expect(getByTestId('counter-value').textContent).toBe('1')

    // Update todo list - only todo component should rerender
    fireEvent.click(getByTestId('add-todo'))
    expect(getByTestId('counter-renders').textContent).toBe('2') // Should not rerender
    expect(getByTestId('todo-renders').textContent).toBe('2')
    expect(getByTestId('todo-count').textContent).toBe('1')

    // Update counter again - only counter component should rerender
    fireEvent.click(getByTestId('increment-counter'))
    expect(getByTestId('counter-renders').textContent).toBe('3')
    expect(getByTestId('todo-renders').textContent).toBe('2') // Should not rerender
    expect(getByTestId('counter-value').textContent).toBe('2')
  })

  it('should allow setters to accept updater functions', () => {
    const ComponentWithUpdaterFunction = () => {
      const [count, setCount] = useGloboState('count', 0)
      return (
        <div>
          <div data-testid='count-value'>{count}</div>
          <button data-testid='increment' onClick={() => setCount(prev => prev + 1)}>Increment</button>
          <button data-testid='decrement' onClick={() => setCount(prev => prev - 1)}>Decrement</button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithUpdaterFunction />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    const countValue = getByTestId('count-value')
    const incrementButton = getByTestId('increment')
    const decrementButton = getByTestId('decrement')

    expect(getNodeText(countValue)).toBe('0')
    fireEvent.click(incrementButton)
    expect(getNodeText(countValue)).toBe('1')
    fireEvent.click(incrementButton)
    expect(getNodeText(countValue)).toBe('2')
    fireEvent.click(decrementButton)
    expect(getNodeText(countValue)).toBe('1')
    fireEvent.click(decrementButton)
    fireEvent.click(decrementButton)
    expect(getNodeText(countValue)).toBe('-1')
  })

  it('should handle different base structure creation scenarios in setAtPath', () => {
    const ComponentWithNestedPaths = () => {
      const [arrayValue, setArrayValue] = useGloboState('testArray[0]', null)
      const [objectValue, setObjectValue] = useGloboState('testObject.nested', null)
      const [deepArrayValue, setDeepArrayValue] = useGloboState('existingArray[2].name', null)
      const [deepObjectValue, setDeepObjectValue] = useGloboState('existingObject.deep.value', null)

      return (
        <div>
          <div data-testid='array-value'>{arrayValue || 'null'}</div>
          <div data-testid='object-value'>{objectValue || 'null'}</div>
          <div data-testid='deep-array-value'>{deepArrayValue || 'null'}</div>
          <div data-testid='deep-object-value'>{deepObjectValue || 'null'}</div>
          
          <button data-testid='set-array' onClick={() => setArrayValue('first-item')}>
            Set Array Item
          </button>
          <button data-testid='set-object' onClick={() => setObjectValue('nested-value')}>
            Set Object Property
          </button>
          <button data-testid='set-deep-array' onClick={() => setDeepArrayValue('array-object-name')}>
            Set Deep Array Item
          </button>
          <button data-testid='set-deep-object' onClick={() => setDeepObjectValue('deep-nested-value')}>
            Set Deep Object Property
          </button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithNestedPaths />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    // Test creating array when curr == null and isIndex is true
    fireEvent.click(getByTestId('set-array'))
    expect(getByTestId('array-value').textContent).toBe('first-item')

    // Test creating object when curr == null and isIndex is false
    fireEvent.click(getByTestId('set-object'))
    expect(getByTestId('object-value').textContent).toBe('nested-value')

    // Test array.slice() when curr is an existing array
    fireEvent.click(getByTestId('set-deep-array'))
    expect(getByTestId('deep-array-value').textContent).toBe('array-object-name')

    // Test {...curr} when curr is an existing object
    fireEvent.click(getByTestId('set-deep-object'))
    expect(getByTestId('deep-object-value').textContent).toBe('deep-nested-value')
  })

  it('should account for existing array structures when setting values', () => {
    const ComponentWithExistingStructures = () => {
      // First, set up existing array and object structures
      const [, setInitialArray] = useGloboState('existingStructures.myArray', [])
      const [, setInitialObject] = useGloboState('existingStructures.myObject', {})
      
      // Then access nested paths that will trigger the ternary
      const [arrayItem, setArrayItem] = useGloboState('existingStructures.myArray[1]', null)
      const [objectProp, setObjectProp] = useGloboState('existingStructures.myObject.nested', null)

      return (
        <div>
          <div data-testid='array-item'>{arrayItem || 'null'}</div>
          <div data-testid='object-prop'>{objectProp || 'null'}</div>
          
          <button data-testid='setup-array' onClick={() => setInitialArray(['existing'])}>
            Setup Array
          </button>
          <button data-testid='setup-object' onClick={() => setInitialObject({ existing: 'prop' })}>
            Setup Object  
          </button>
          <button data-testid='modify-array' onClick={() => setArrayItem('new-item')}>
            Modify Array
          </button>
          <button data-testid='modify-object' onClick={() => setObjectProp('new-prop')}>
            Modify Object
          </button>
        </div>
      )
    }

    const App = () => (
      <Provider>
        <ComponentWithExistingStructures />
      </Provider>
    )

    const { getByTestId } = render(<App />)

    // Setup existing structures first
    fireEvent.click(getByTestId('setup-array'))
    fireEvent.click(getByTestId('setup-object'))

    // Test Array.isArray(curr) === true path: curr.slice()
    // This should clone the existing array when setting myArray[1]
    fireEvent.click(getByTestId('modify-array'))
    expect(getByTestId('array-item').textContent).toBe('new-item')

    // Test Array.isArray(curr) === false path: { ...curr }
    // This should spread the existing object when setting myObject.nested
    fireEvent.click(getByTestId('modify-object'))
    expect(getByTestId('object-prop').textContent).toBe('new-prop')
  })
})
