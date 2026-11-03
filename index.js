import React, { createContext, useContext, useMemo, useRef, useCallback } from 'react'
import { useSyncExternalStore } from 'react'

// Converts 'a.b[0].c' (or an array of keys) into ['a', 'b', '0', 'c'].
// A path with no segments (e.g. '') is treated as a single literal key, like lodash.
const toPath = pathInput =>
  Array.isArray(pathInput)
    ? pathInput
    : String(pathInput).match(/[^.[\]]+/g) || [String(pathInput)]

const getAtPath = (root, pathInput) => {
  const keys = toPath(pathInput)
  let curr = root
  for (let i = 0; i < keys.length; i++) {
    if (curr == null) return undefined
    curr = curr[keys[i]]
  }
  return curr
}

// Only canonical non-negative integers ('0', '12') create arrays; '1e3', '-1', '' and ' ' don't.
const isArrayIndex = key => /^(?:0|[1-9]\d*)$/.test(String(key))

const setAtPath = (root, pathInput, nextVal) => {
  const keys = toPath(pathInput)

  const setRec = (curr, i) => {
    if (i === keys.length) {
      return nextVal
    }

    const key = keys[i]
    const child = curr != null ? curr[key] : undefined
    const updatedChild = setRec(child, i + 1)

    const isIndex = isArrayIndex(key)
    const base =
      curr == null
        ? isIndex ? [] : {}
        : Array.isArray(curr) ? curr.slice() : { ...curr }

    base[key] = updatedChild
    return base
  }

  return setRec(root, 0)
}

const isPlainObject = v => {
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

// Shallow comparison is only meaningful for two arrays or two plain objects.
// Dates, Maps, Sets and class instances have no own enumerable keys to compare,
// so they (and array-vs-object pairs) fall back to reference equality.
const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  const bothArrays = Array.isArray(a) && Array.isArray(b)
  const bothPlain = !Array.isArray(a) && !Array.isArray(b) && isPlainObject(a) && isPlainObject(b)
  if (!bothArrays && !bothPlain) return false
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
      const prevAtPathVal = getAtPath(prev, path)
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

    return React.createElement(
      GlobalStateContext.Provider,
      { value: api },
      props.children
    )
  }

  const useGloboState = (path, defaultValue) => {
    const ctx = useContext(GlobalStateContext)
    if (!ctx) throw new Error('useGloboState must be used within a Provider')
    
    const { getState, subscribe, setGlobalState } = ctx

    // Parse the path once per distinct path, not on every store change. Keying on
    // a string means inline array paths (['a', 'b']) don't produce new callbacks.
    const pathKey = Array.isArray(path) ? '\u0000' + path.join('\u0000') : String(path)
    const keys = useMemo(() => toPath(path), [pathKey]) // eslint-disable-line react-hooks/exhaustive-deps

    // Inline defaults (useGloboState('list', [])) are a new object every render.
    // Read the latest one through a ref so the getter and setter stay stable.
    const defaultRef = useRef(defaultValue)
    defaultRef.current = defaultValue

    // Memoize the last selected value so useSyncExternalStore can skip re-renders
    const lastRef = useRef({ has: false, val: undefined })

    const getSnapshot = useCallback(() => {
      const selected = getAtPath(getState(), keys)
      const val = selected === undefined ? defaultRef.current : selected

      if (!lastRef.current.has || !shallowEqual(val, lastRef.current.val)) {
        lastRef.current = { has: true, val: val }
      }

      return lastRef.current.val
    }, [getState, keys])

    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    const setValue = useCallback(newValue => {
      setGlobalState(keys, newValue, defaultRef.current)
    }, [keys, setGlobalState])

    return [value, setValue]
  }

  return { Provider, useGloboState }
}

const { Provider, useGloboState } = createProvider()

export { createProvider, Provider, useGloboState }