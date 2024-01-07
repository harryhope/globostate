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
    expect(getNodeText(list)).toBe('milk,eggs,bread,taters,...')
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
})
