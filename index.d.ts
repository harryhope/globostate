import React from 'react'

type SetStateFunction<T> = (newValue: T) => void

type UseGloboState = <T>(path: string, defaultValue: T) => [T, SetStateFunction<T>]

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