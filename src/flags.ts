import { signal, type Signal } from "@preact/signals"
import { useSyncExternalStore } from "react"

export type Subscribable<T> = Signal<T> & {
	subscribe: (fn: (value: T) => void) => () => void
}

export type Values<T> = Signal<T> & Subscribable<T>

export function values<T>(values: T): Values<T> {
	const state = signal(values) as Values<T>
	const originalSubscribe = state.subscribe.bind(state)
	state.subscribe = (fn: (value: T) => void) => {
		let isFirst = true
		return originalSubscribe((value) => {
			if (isFirst) {
				isFirst = false
				return
			}
			fn(value)
		})
	}
	return state
}

export type Flags<T> = Signal<T> & Subscribable<T>

export function flags<T>(values: T): Flags<T> {
	const state = signal(values) as Flags<T>
	const originalSubscribe = state.subscribe.bind(state)
	state.subscribe = (fn: (value: T) => void) => {
		let isFirst = true
		return originalSubscribe((value) => {
			if (isFirst) {
				isFirst = false
				return
			}
			fn(value)
		})
	}
	return state
}

export function useFlag<T>(flags: Subscribable<T>, key: keyof T) {
	return useSyncExternalStore(
		(cb) => flags.subscribe(cb),
		() => flags.value[key],
		() => null,
	)
}
