import React, { createContext, useContext, useMemo, useRef, useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import get from 'lodash/get'
import toPath from 'lodash/toPath'
import cloneDeep from 'lodash/cloneDeep'

const setAtPath = (root, pathInput, nextVal) => {  
  const keys = Array.isArray(pathInput) ? pathInput : toPath(pathInput)

  const setRec = (curr, i) => {
    if (i === keys.length) {
      return nextVal
    }

    const key = keys[i]
    const child = curr != null ? curr[key] : undefined
    const updatedChild = setRec(child, i + 1)

    const isIndex = Number.isInteger(+key)
    const base =
      curr == null
        ? isIndex ? [] : {}
        : Array.isArray(curr) ? curr.slice() : { ...curr }

    base[key] = updatedChild
    return base
  }

  return setRec(root, 0)
}

const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (let k of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false
  }
  return true
}

const createProvider = () => {
  const GlobalStateContext = createContext(null)

  const Provider = props => {
    // External store so Provider itself doesn't re-render on state changes
    const storeRef = useRef({
      state: {},
      listeners: new Set()
    })

    const getState = useCallback(() => storeRef.current.state, [])

    const subscribe = useCallback(listener => {
      storeRef.current.listeners.add(listener)
      return () => storeRef.current.listeners.delete(listener)
    }, [])

    const notify = useCallback(() => {
      Array.from(storeRef.current.listeners).forEach(l => l())
    }, [])

    const setGlobalState = useCallback((path, valueOrUpdater, defaultValue) => {
      const prev = storeRef.current.state
      const prevAtPathVal = get(prev, path)
      const prevAtPath = prevAtPathVal === undefined ? defaultValue : prevAtPathVal
      const nextAtPath = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prevAtPath)
        : valueOrUpdater

      // Skip if no actual change
      if (Object.is(prevAtPath, nextAtPath)) return

      const nextState = setAtPath(prev, path, nextAtPath)

      storeRef.current.state = nextState
      notify()
    }, [notify])

    // Stable API in context (doesn't change between renders)
    const api = useMemo(() => ({ getState, setGlobalState, subscribe }), [getState, setGlobalState, subscribe])

    return (
      <GlobalStateContext.Provider value={api}>
        {props.children}
      </GlobalStateContext.Provider>
    )
  }

  const useGloboState = (path, defaultValue) => {
    const ctx = useContext(GlobalStateContext)
    if (!ctx) throw new Error('useGloboState must be used within a Provider')
    
    const { getState, subscribe, setGlobalState } = ctx

    // Memoize the last selected value so useSyncExternalStore can skip re-renders
    const lastRef = useRef({ has: false, val: undefined })

    const getSnapshot = useCallback(() => {
      const whole = getState()
      const selected = get(whole, path)
      const val = selected === undefined ? defaultValue : selected

      const equal = typeof val === 'object' && val !== null
        ? shallowEqual(val, lastRef.current.val)
        : Object.is(val, lastRef.current.val)

      if (!lastRef.current.has || !equal) {
        const clonedVal = Array.isArray(val) ? cloneDeep(val) : val
        lastRef.current = { has: true, val: clonedVal }
      }

      return lastRef.current.val
    }, [getState, path, defaultValue])

    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    
    const setValue = useCallback(newValue => {
      setGlobalState(path, newValue, defaultValue)
    }, [path, defaultValue,setGlobalState])

    return [value, setValue]
  }

  return { Provider, useGloboState }
}

const { Provider, useGloboState } = createProvider()

export { createProvider, Provider, useGloboState }