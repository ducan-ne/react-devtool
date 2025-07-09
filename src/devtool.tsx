"use client"
import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { scan } from "@devtool/core/index"
import { userChildren } from "@devtool/state"
import { signal, type Signal } from "@preact/signals"
import type { Subscribable } from "./ui"

type DevtoolProps = {
	children: ReactNode
}

/**
 * @public
 * Devtool component that works with both React and Preact
 */
export const Devtool = ({ children }: DevtoolProps) => {
	useEffect(() => {
		scan({
			enabled: true,
			showToolbar: true,
			showFPS: false,
		})

		return () => {
			scan({
				enabled: false,
			})
		}
	}, [])

	useEffect(() => {
		userChildren.value = children
		return () => {
			userChildren.value = null
		}
	}, [children])

	return null
}

type Values<T> = Signal<T> & Subscribable<T>

export function values<T>(values: T): Values<T> {
	return signal(values) as Values<T>
}

type Flags<T> = Signal<T> & Subscribable<T>

export function flags<T>(values: T): Flags<T> {
	return signal(values) as Flags<T>
}

export function useFlag<T>(flags: Subscribable<T>, key: keyof T) {
	return useSyncExternalStore(
		(cb) => flags.subscribe(cb),
		() => {
			return flags.value[key]
		},
		() => null,
	)
}
