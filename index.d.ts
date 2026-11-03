import React from 'react'

/** Pass a new value, or an updater that receives the current value (or the default). */
type SetStateFunction<T> = (newValue: T | ((prev: T) => T)) => void

/** A dot/bracket path like 'a.b[0].c', or an array of keys like ['a', 'b', 0, 'c']. */
export type GloboPath = string | ReadonlyArray<string | number>

type UseGloboState = <T>(path: GloboPath, defaultValue: T) => [T, SetStateFunction<T>]

interface ProviderProps {
  children: React.ReactNode
}
interface GloboProvider extends React.FunctionComponent<ProviderProps> {}

interface CreateProvider {
  (): {
    Provider: GloboProvider
    useGloboState: UseGloboState
  }
}

export declare const createProvider: CreateProvider
export declare const Provider: GloboProvider
export declare const useGloboState: UseGloboState