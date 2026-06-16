import { signal, type Signal } from "@preact/signals"
import { useSyncExternalStore } from "react"
import { registerFlagSet } from "./window-flags"

const FLAGS_STORAGE_PREFIX = "react-devtool:flags:"
const FLAGS_STORAGE_SOURCE = "react-devtool.flags"

export type Subscribable<T> = Signal<T> & {
	subscribe: (fn: (value: T) => void) => () => void
}

export type FlagPersistHydrateStrategy = "merge" | "replace"

export type FlagPersistOptions<T> = {
	key: string
	storage?: Storage | (() => Storage | null | undefined)
	hydrate?: FlagPersistHydrateStrategy
	version?: number
	validate?: (value: unknown) => Partial<T> | null
	syncTabs?: boolean
	debounceMs?: number
}

export type FlagOptions<T> = {
	persist?: false | string | FlagPersistOptions<T>
	/**
	 * Registers this flag set on `window.flags` while `<Devtool />` is mounted.
	 */
	name?: string
}

type StorageResolver = () => Storage | null | undefined

type NormalizedFlagPersistOptions<T> = Omit<FlagPersistOptions<T>, "storage" | "hydrate"> & {
	storage?: StorageResolver
	storageKey: string
	hydrate: FlagPersistHydrateStrategy
}

type PersistedFlags<T> = {
	source: typeof FLAGS_STORAGE_SOURCE
	version?: number
	value: Partial<T>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const cloneFlags = <T extends Record<string, boolean>>(flags: T): T => ({ ...flags })

const getDefaultStorage = (): Storage | undefined => {
	if (typeof window === "undefined") {
		return undefined
	}

	try {
		return window.localStorage
	} catch {
		return undefined
	}
}

const normalizePersistOptions = <T,>(
	persist: FlagOptions<T>["persist"],
): NormalizedFlagPersistOptions<T> | null => {
	if (!persist) {
		return null
	}

	if (typeof persist === "string") {
		return {
			key: persist,
			storageKey: `${FLAGS_STORAGE_PREFIX}${persist}`,
			hydrate: "merge",
		}
	}

	let storage: StorageResolver | undefined
	if (typeof persist.storage === "function") {
		storage = persist.storage
	} else if (persist.storage) {
		const storageValue = persist.storage
		storage = () => storageValue
	}

	return {
		...persist,
		storage,
		storageKey: `${FLAGS_STORAGE_PREFIX}${persist.key}`,
		hydrate: persist.hydrate ?? "merge",
	}
}

const resolveStorage = <T,>(
	options: NormalizedFlagPersistOptions<T>,
): Storage | undefined => {
	try {
		return options.storage?.() ?? getDefaultStorage()
	} catch {
		return undefined
	}
}

const sanitizePersistedFlags = <T extends Record<string, boolean>>(
	value: unknown,
	defaults: T,
): Partial<T> | null => {
	if (!isRecord(value)) {
		return null
	}

	const nextFlags: Record<string, boolean> = {}
	for (const key of Object.keys(defaults)) {
		const persistedValue = value[key]
		if (typeof persistedValue === "boolean") {
			nextFlags[key] = persistedValue
		}
	}

	return Object.keys(nextFlags).length > 0 ? (nextFlags as Partial<T>) : null
}

const parsePersistedFlags = <T extends Record<string, boolean>>(
	storedValue: string,
	options: NormalizedFlagPersistOptions<T>,
	defaults: T,
): Partial<T> | null => {
	try {
		const parsedValue: unknown = JSON.parse(storedValue)
		const isEnvelope =
			isRecord(parsedValue) &&
			parsedValue.source === FLAGS_STORAGE_SOURCE &&
			"value" in parsedValue

		if (options.version !== undefined) {
			const storedVersion = isEnvelope ? parsedValue.version : undefined
			if (storedVersion !== options.version) {
				return null
			}
		}

		const candidate = isEnvelope ? parsedValue.value : parsedValue
		if (options.validate) {
			return sanitizePersistedFlags(options.validate(candidate), defaults)
		}

		return sanitizePersistedFlags(candidate, defaults)
	} catch {
		return null
	}
}

const readPersistedFlags = <T extends Record<string, boolean>>(
	options: NormalizedFlagPersistOptions<T>,
	defaults: T,
): Partial<T> | null => {
	const storage = resolveStorage(options)
	if (!storage) {
		return null
	}

	try {
		const storedValue = storage.getItem(options.storageKey)
		return storedValue ? parsePersistedFlags(storedValue, options, defaults) : null
	} catch {
		return null
	}
}

const mergeFlags = <T extends Record<string, boolean>>(
	defaults: T,
	persisted: Partial<T> | null,
	strategy: FlagPersistHydrateStrategy,
): T => {
	if (!persisted) {
		return cloneFlags(defaults)
	}

	if (strategy === "replace") {
		return { ...persisted } as T
	}

	return { ...defaults, ...persisted }
}

const writePersistedFlags = <T extends Record<string, boolean>>(
	options: NormalizedFlagPersistOptions<T>,
	value: T,
): void => {
	const storage = resolveStorage(options)
	if (!storage) {
		return
	}

	try {
		const payload: PersistedFlags<T> = {
			source: FLAGS_STORAGE_SOURCE,
			value,
		}
		if (options.version !== undefined) {
			payload.version = options.version
		}
		storage.setItem(options.storageKey, JSON.stringify(payload))
	} catch {
		// Storage can be unavailable in private mode, SSR, or locked-down iframes.
	}
}

const removePersistedFlags = <T,>(options: NormalizedFlagPersistOptions<T>): void => {
	const storage = resolveStorage(options)
	if (!storage) {
		return
	}

	try {
		storage.removeItem(options.storageKey)
	} catch {
		// Ignore storage failures for the same reasons writes are best-effort.
	}
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

export type FlagSet<T> = Signal<T> &
	Subscribable<T> & {
		reset: () => void
		hydrate: () => void
		clearPersisted: () => void
	}

export function flags<T extends Record<string, boolean>>(
	values: T,
	options: FlagOptions<T> = {},
): FlagSet<T> {
	const defaults = cloneFlags(values)
	const persistOptions = normalizePersistOptions(options.persist)
	const persistedFlags = persistOptions
		? readPersistedFlags(persistOptions, defaults)
		: null
	const state = signal(
		mergeFlags(defaults, persistedFlags, persistOptions?.hydrate ?? "merge"),
	) as FlagSet<T>
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

	let debounceHandle: ReturnType<typeof setTimeout> | undefined
	let isApplyingPersistedValue = false

	const clearPendingPersist = () => {
		if (debounceHandle !== undefined) {
			clearTimeout(debounceHandle)
			debounceHandle = undefined
		}
	}

	const persistCurrentValue = () => {
		if (!persistOptions) {
			return
		}
		writePersistedFlags(persistOptions, state.value)
	}

	const schedulePersist = () => {
		if (!persistOptions) {
			return
		}

		const debounceMs = persistOptions.debounceMs ?? 0
		if (debounceMs <= 0) {
			persistCurrentValue()
			return
		}

		clearPendingPersist()
		debounceHandle = setTimeout(() => {
			debounceHandle = undefined
			persistCurrentValue()
		}, debounceMs)
	}

	const applyPersistedValue = (value: T) => {
		isApplyingPersistedValue = true
		state.value = value
		isApplyingPersistedValue = false
	}

	state.reset = () => {
		state.value = cloneFlags(defaults)
	}

	state.hydrate = () => {
		if (!persistOptions) {
			return
		}

		const nextFlags = readPersistedFlags(persistOptions, defaults)
		if (!nextFlags) {
			return
		}

		applyPersistedValue(mergeFlags(defaults, nextFlags, persistOptions.hydrate))
	}

	state.clearPersisted = () => {
		if (!persistOptions) {
			return
		}

		clearPendingPersist()
		removePersistedFlags(persistOptions)
	}

	if (options.name) {
		registerFlagSet(options.name, state, defaults)
	}

	if (persistOptions) {
		let isFirst = true
		originalSubscribe(() => {
			if (isFirst) {
				isFirst = false
				return
			}

			if (isApplyingPersistedValue) {
				return
			}

			schedulePersist()
		})

		if (persistOptions.syncTabs && typeof window !== "undefined") {
			window.addEventListener("storage", (event) => {
				if (event.key !== persistOptions.storageKey) {
					return
				}

				clearPendingPersist()

				if (!event.newValue) {
					applyPersistedValue(cloneFlags(defaults))
					return
				}

				const nextFlags = parsePersistedFlags(event.newValue, persistOptions, defaults)
				if (nextFlags) {
					applyPersistedValue(mergeFlags(defaults, nextFlags, persistOptions.hydrate))
				}
			})
		}
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
