import type { Subscribable } from "./flags"

/**
 * Augment this interface to type `window.flags` for your app:
 *
 * ```ts
 * declare module "react-devtool" {
 *   interface Flags {
 *     myAppFlags: { showDebugLabels: boolean; verboseLogs: boolean }
 *   }
 * }
 * ```
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Flags {}

type BooleanFlagRecord = Record<string, boolean>

type FlagSetEntry = {
	flags: Subscribable<BooleanFlagRecord>
	defaults: BooleanFlagRecord
}

const flagSets = new Map<string, FlagSetEntry>()
const llmsListeners = new Set<() => void>()
let isWindowFlagsMounted = false
let windowFlagsProxy: WindowFlagsApi | null = null

const isBooleanRecord = (value: unknown): value is BooleanFlagRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const notifyLlmsListeners = () => {
	for (const listener of llmsListeners) {
		listener()
	}
}

const formatFlagSetLine = (name: string, defaults: BooleanFlagRecord): string => {
	const keys = Object.keys(defaults)
		.map((key) => `${key} (default: ${String(defaults[key])})`)
		.join(", ")
	return `- ${name}: ${keys}`
}

export const buildFlagsLlmsText = (): string => {
	if (flagSets.size === 0) {
		return [
			"React Devtool flags API (active while <Devtool /> is mounted).",
			"No flag sets are registered yet.",
			"Create flags with flags(initial, { name: \"myFlags\" }) and render them in <Devtool />.",
			"Then set values from the console: window.flags.myFlags.flagName = true",
		].join("\n")
	}

	const lines = [
		"React Devtool flags API (active while <Devtool /> is mounted).",
		"Read: window.flags.<setName>.<flagName>",
		"Write: window.flags.<setName>.<flagName> = true|false",
		"Bulk write: window.flags.<setName> = { flagName: true }",
		"",
		"Registered flag sets:",
		...Array.from(flagSets.entries()).map(([name, entry]) =>
			formatFlagSetLine(name, entry.defaults),
		),
	]

	return lines.join("\n")
}

const createFlagSetProxy = (entry: FlagSetEntry): BooleanFlagRecord => {
	return new Proxy({} as BooleanFlagRecord, {
		get(_target, prop) {
			if (prop === "then") {
				return undefined
			}
			if (typeof prop !== "string") {
				return undefined
			}
			return entry.flags.value[prop]
		},
		set(_target, prop, value) {
			if (typeof prop !== "string" || typeof value !== "boolean") {
				return false
			}
			entry.flags.value = {
				...entry.flags.value,
				[prop]: value,
			}
			return true
		},
		ownKeys() {
			return Object.keys(entry.flags.value)
		},
		getOwnPropertyDescriptor(_target, prop) {
			if (typeof prop !== "string") {
				return undefined
			}
			return {
				configurable: true,
				enumerable: true,
				value: entry.flags.value[prop],
				writable: true,
			}
		},
	})
}

const createWindowFlagsProxy = (): WindowFlagsApi => {
	return new Proxy({} as WindowFlagsApi, {
		get(_target, prop) {
			if (prop === "llms") {
				return buildFlagsLlmsText()
			}
			if (typeof prop !== "string") {
				return undefined
			}
			const entry = flagSets.get(prop)
			return entry ? createFlagSetProxy(entry) : undefined
		},
		set(_target, prop, value) {
			if (prop === "llms" || typeof prop !== "string" || !isBooleanRecord(value)) {
				return false
			}
			const entry = flagSets.get(prop)
			if (!entry) {
				return false
			}

			const nextValue = { ...entry.flags.value }
			for (const [key, flagValue] of Object.entries(value)) {
				if (typeof flagValue === "boolean" && key in entry.defaults) {
					nextValue[key] = flagValue
				}
			}
			entry.flags.value = nextValue
			return true
		},
	})
}

export type WindowFlagsApi = {
	readonly llms: string
} & {
	[K in keyof Flags]: Flags[K]
}

export const registerFlagSet = <T extends BooleanFlagRecord>(
	name: string,
	flags: Subscribable<T>,
	defaults: T,
): void => {
	flagSets.set(name, {
		flags,
		defaults,
	})
	notifyLlmsListeners()
}

export const unregisterFlagSet = (name: string): void => {
	if (!flagSets.delete(name)) {
		return
	}
	notifyLlmsListeners()
}

export const subscribeFlagsLlms = (listener: () => void): (() => void) => {
	llmsListeners.add(listener)
	return () => {
		llmsListeners.delete(listener)
	}
}

export const mountWindowFlags = (): void => {
	if (typeof window === "undefined") {
		return
	}

	isWindowFlagsMounted = true
	windowFlagsProxy ??= createWindowFlagsProxy()
	window.flags = windowFlagsProxy
	notifyLlmsListeners()
}

export const unmountWindowFlags = (): void => {
	if (typeof window === "undefined") {
		return
	}

	isWindowFlagsMounted = false
	if (window.flags === windowFlagsProxy) {
		window.flags = undefined
	}
	notifyLlmsListeners()
}

export const isWindowFlagsActive = (): boolean => isWindowFlagsMounted

declare global {
	interface Window {
		flags?: WindowFlagsApi
	}
}
