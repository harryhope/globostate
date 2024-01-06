import React, { createContext, useContext, useState } from 'react'
import set from 'lodash/set'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'

const createProvider = () => {
  const GlobalStateContext = createContext()

  const Provider = ({ children }) => {
    const [state, setState] = useState({})

    const setGlobalState = (path, value) => {
      setState((currentState) => {
        const newState = cloneDeep(currentState)
        set(newState, path, value)
        return newState
      })
    }

    return (
      <GlobalStateContext.Provider value={{ state, setGlobalState }}>
        {children}
      </GlobalStateContext.Provider>
    )
  }

  const useGloboState = (path, defaultValue) => {
    const { state, setGlobalState } = useContext(GlobalStateContext)
    const value = get(state, path, defaultValue)

    const setValue = (newValue) => {
      setGlobalState(path, newValue)
    }

    return [value, setValue]
  }

  return { Provider, useGloboState }
}

const { Provider, useGloboState } = createProvider()

export { createProvider, Provider, useGloboState }