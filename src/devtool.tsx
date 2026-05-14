import { useEffect, useRef, type ReactNode } from "react"
import { scan } from "@devtool/core/index"
import { userChildren } from "@devtool/state"
import { signal, type Signal } from "@preact/signals"
import type { Subscribable } from "./ui"
export { useFlag } from "./ui"

type DevtoolProps = {
	children: ReactNode
}

export function abc() {
	return 123
}

/**
 * @public
 */
export const Devtool = ({ children }: DevtoolProps) => {
	const cleanupTokenRef = useRef(0)

	// Initialize scanner lifecycle once.
	useEffect(() => {
		scan({
			enabled: true,
			showToolbar: true,
			showFPS: false,
			dangerouslyForceRunInProduction: true,
		})

		return () => {
			scan({ enabled: false })
		}
	}, [])

	// Keep the currently rendered devtool children in sync without teardown churn.
	useEffect(() => {
		const cleanupToken = ++cleanupTokenRef.current
		userChildren.value = children
		return () => {
			// Avoid synchronously unmounting the devtool root during React's render/commit.
			queueMicrotask(() => {
				if (cleanupTokenRef.current === cleanupToken) {
					userChildren.value = null
				}
			})
		}
	}, [children])

	// This component only sets up the devtool and doesn't render anything itself.
	return null
}

type Values<T> = Signal<T> & Subscribable<T>

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

type Flags<T> = Signal<T> & Subscribable<T>

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
