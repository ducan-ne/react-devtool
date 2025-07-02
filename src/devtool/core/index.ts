import { type Signal, signal } from "@preact/signals"
import {
	type Fiber,
	detectReactBuildType,
	getRDTHook,
	isInstrumentationActive,
} from "bippy"
import type { ComponentType } from "preact"
import type { ReactNode } from "preact/compat"
import type { RenderData } from "~core/utils"
import { createToolbar } from "~web/toolbar"
import { IS_CLIENT } from "~web/utils/constants"
import { readLocalStorage, saveLocalStorage } from "~web/utils/helpers"
import type { Outline } from "~web/utils/outline"
import type { States } from "~web/views/inspector/utils"
import styles from "../../index.css?inline"
import type {
	ChangeReason,
	Render,
	createInstrumentation,
} from "./instrumentation"
import type { InternalInteraction } from "./monitor/types"
import type { getSession } from "./monitor/utils"
import { startTimingTracking } from "./notifications/event-tracking"
import { createHighlightCanvas } from "./notifications/outline-overlay"

declare global {
	interface Window {
		__REACT_DEVTOOL_VERSION__?: string
		__REACT_DEVTOOL_STOP__?: () => void
		__REACT_DEVTOOL_TOOLBAR_CONTAINER__?: HTMLElement
		reactDevtoolCleanupListeners?: () => void
	}
}

let rootContainer: HTMLDivElement | null = null
let shadowRoot: ShadowRoot | null = null

// Font loading function for shadow DOM compatibility
const loadOptimisticFonts = () => {
	if (!IS_CLIENT || document.getElementById("react-devtool-fonts")) {
		return // Fonts already loaded or not in client
	}

	const fontCSS = `
		/* Arabic */
		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Arbc_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0600-06FF;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Arbc_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0600-06FF;
		}

		/* Cyrillic */
		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Cyrl_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Cyrl_W_SBd.woff2') format('woff2');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Cyrl_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Cyrl_W_Rg.woff2') format('woff2');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Cyrl_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Cyrl_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0400-045F, U+2116;
		}

		/* Devanagari */
		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Deva_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Deva_W_SBd.woff2') format('woff2');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Deva_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Deva_W_Rg.woff2') format('woff2');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Deva_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Deva_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;
		}

		/* Vietnamese */
		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Viet_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Viet_W_SBd.woff2') format('woff2');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_Viet_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Viet_W_Rg.woff2') format('woff2');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Viet_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_Viet_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
		}

		/* Latin Extended */
		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_SBd.woff2') format('woff2');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Rg.woff2') format('woff2');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
		}

		/* Latin */
		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_SBd.woff2') format('woff2');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}

		@font-face {
			font-family: 'Optimistic Display';
			src: url('https://react.dev/fonts/Optimistic_Display_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Rg.woff2') format('woff2');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Md.woff2') format('woff2');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}

		@font-face {
			font-family: 'Optimistic Text';
			src: url('https://react.dev/fonts/Optimistic_Text_W_Bd.woff2') format('woff2');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		}
	`

	const styleElement = document.createElement("style")
	styleElement.id = "react-devtool-fonts"
	styleElement.textContent = fontCSS
	document.head.appendChild(styleElement)
}

// @TODO: @pivanov - add back in when options are implemented
// const audioContext: AudioContext | null = null;

interface RootContainer {
	rootContainer: HTMLDivElement
	shadowRoot: ShadowRoot
}

const initRootContainer = (): RootContainer => {
	if (rootContainer && shadowRoot) {
		return { rootContainer, shadowRoot }
	}

	rootContainer = document.createElement("div")
	rootContainer.id = "react-devtool-root"

	shadowRoot = rootContainer.attachShadow({ mode: "open" })

	const cssStyles = document.createElement("style")
	cssStyles.textContent = styles

	shadowRoot.appendChild(cssStyles)

	document.documentElement.appendChild(rootContainer)

	return { rootContainer, shadowRoot }
}

// export interface UnstableOptions {
//   /**
//    * Enable/disable scanning
//    *
//    * Please use the recommended way:
//    * enabled: process.env.NODE_ENV === 'development',
//    *
//    * @default true
//    */
//   enabled?: boolean;

//   /**
//    * Force React Scan to run in production (not recommended)
//    *
//    * @default false
//    */
//   dangerouslyForceRunInProduction?: boolean;

//   /**
//    * Animation speed
//    *
//    * @default "fast"
//    */
//   animationSpeed?: 'slow' | 'fast' | 'off';

//   /**
//    * Smoothly animate the re-render outline when the element moves
//    *
//    * @default true
//    */
//   smoothlyAnimateOutlines?: boolean;

//   /**
//    * Show toolbar bar
//    *
//    * If you set this to true, and set {@link enabled} to false, the toolbar will still show, but scanning will be disabled.
//    *
//    * @default true
//    */
//   showToolbar?: boolean;
// }

interface Options {
	/**
	 * Enable/disable scanning
	 *
	 * Please use the recommended way:
	 * enabled: process.env.NODE_ENV === 'development',
	 *
	 * @default true
	 */
	enabled?: boolean

	/**
	 * Force React Scan to run in production (not recommended)
	 *
	 * @default false
	 */
	dangerouslyForceRunInProduction?: boolean
	/**
	 * Log renders to the console
	 *
	 * WARNING: This can add significant overhead when the app re-renders frequently
	 *
	 * @default false
	 */
	log?: boolean

	/**
	 * Show toolbar bar
	 *
	 * If you set this to true, and set {@link enabled} to false, the toolbar will still show, but scanning will be disabled.
	 *
	 * @default true
	 */
	showToolbar?: boolean

	/**
	 * Animation speed
	 *
	 * @default "fast"
	 */
	animationSpeed?: "slow" | "fast" | "off"

	/**
	 * Track unnecessary renders, and mark their outlines gray when detected
	 *
	 * An unnecessary render is defined as the component re-rendering with no change to the component's
	 * corresponding dom subtree
	 *
	 *  @default false
	 *  @warning tracking unnecessary renders can add meaningful overhead to react-scan
	 */
	trackUnnecessaryRenders?: boolean

	/**
	 * Should the FPS meter show in the toolbar
	 *
	 *  @default true
	 */
	showFPS?: boolean

	/**
	 * Should the number of slowdown notifications be shown in the toolbar
	 *
	 *  @default true
	 */
	showNotificationCount?: boolean

	/**
	 * Allow React Scan to run inside iframes
	 *
	 * @default false
	 */
	allowInIframe?: boolean

	/**
	 * Should react scan log internal errors to the console.
	 *
	 * Useful if react scan is not behaving expected and you want to provide information to maintainers when submitting an issue https://github.com/aidenybai/react-scan/issues
	 *
	 *  @default false
	 */
	_debug?: "verbose" | false

	onCommitStart?: () => void
	onRender?: (fiber: Fiber, renders: Array<Render>) => void
	onCommitFinish?: () => void
	onPaintStart?: (outlines: Array<Outline>) => void
	onPaintFinish?: (outlines: Array<Outline>) => void
}

interface Monitor {
	pendingRequests: number
	interactions: Array<InternalInteraction>
	session: ReturnType<typeof getSession>
	url: string | null
	route: string | null
	apiKey: string | null
	commit: string | null
	branch: string | null
}

interface StoreType {
	inspectState: Signal<States>
	wasDetailsOpen: Signal<boolean>
	lastReportTime: Signal<number>
	isInIframe: Signal<boolean>
	monitor: Signal<Monitor | null>
	fiberRoots: WeakSet<Fiber>
	reportData: Map<number, RenderData>
	legacyReportData: Map<string, RenderData>
	changesListeners: Map<number, Array<ChangesListener>>
	interactionListeningForRenders:
		| ((fiber: Fiber, renders: Array<Render>) => void)
		| null
}

export type OutlineKey = `${string}-${string}`

interface Internals {
	instrumentation: ReturnType<typeof createInstrumentation> | null
	componentAllowList: WeakMap<ComponentType<unknown>, Options> | null
	options: Signal<Options>
	scheduledOutlines: Map<Fiber, Outline> // we clear t,his nearly immediately, so no concern of mem leak on the fiber
	// outlines at the same coordinates always get merged together, so we pre-compute the merge ahead of time when aggregating in activeOutlines
	activeOutlines: Map<OutlineKey, Outline> // we re-use the outline object on the scheduled outline
	onRender: ((fiber: Fiber, renders: Array<Render>) => void) | null
	Store: StoreType
	version: string
	runInAllEnvironments: boolean
}

type FunctionalComponentStateChange = {
	type: ChangeReason.FunctionalState
	value: unknown
	prevValue?: unknown
	count?: number | undefined
	name: string
}
type ClassComponentStateChange = {
	type: ChangeReason.ClassState
	value: unknown
	prevValue?: unknown
	count?: number | undefined
	name: "state"
}

export type StateChange =
	| FunctionalComponentStateChange
	| ClassComponentStateChange
export type PropsChange = {
	type: ChangeReason.Props
	name: string
	value: unknown
	prevValue?: unknown
	count?: number | undefined
}
export type ContextChange = {
	type: ChangeReason.Context
	name: string
	value: unknown
	prevValue?: unknown
	count?: number | undefined
	contextType: number
}

export type Change = StateChange | PropsChange | ContextChange

export type ChangesPayload = {
	propsChanges: Array<PropsChange>
	stateChanges: Array<
		FunctionalComponentStateChange | ClassComponentStateChange
	>
	contextChanges: Array<ContextChange>
}
export type ChangesListener = (changes: ChangesPayload) => void

export const Store: StoreType = {
	wasDetailsOpen: signal(true),
	isInIframe: signal(IS_CLIENT && window.self !== window.top),
	inspectState: signal<States>({
		kind: "uninitialized",
	}),
	monitor: signal<Monitor | null>(null),
	fiberRoots: new Set<Fiber>(),
	reportData: new Map<number, RenderData>(),
	legacyReportData: new Map<string, RenderData>(),
	lastReportTime: signal(0),
	interactionListeningForRenders: null,
	changesListeners: new Map(),
}

export const ReactDevtoolInternals: Internals = {
	instrumentation: null,
	componentAllowList: null,
	options: signal({
		enabled: true,
		// includeChildren: true,
		// playSound: false,
		log: false,
		showToolbar: true,
		// renderCountThreshold: 0,
		// report: undefined,
		// alwaysShowLabels: false,
		animationSpeed: "fast",
		dangerouslyForceRunInProduction: false,
		showFPS: true,
		showNotificationCount: true,
		allowInIframe: false,
		// smoothlyAnimateOutlines: true,
		// trackUnnecessaryRenders: false,
	}),
	runInAllEnvironments: false,
	onRender: null,
	scheduledOutlines: new Map(),
	activeOutlines: new Map(),
	Store,
	version: "0.0.1",
}

type LocalStorageOptions = Omit<
	Options,
	| "onCommitStart"
	| "onRender"
	| "onCommitFinish"
	| "onPaintStart"
	| "onPaintFinish"
>

function isOptionKey(key: string): key is keyof Options {
	return key in ReactDevtoolInternals.options.value
}

const validateOptions = (options: Partial<Options>): Partial<Options> => {
	const errors: Array<string> = []
	const validOptions: Partial<Options> = {}

	for (const key in options) {
		if (!isOptionKey(key)) continue

		const value = options[key]
		switch (key) {
			case "enabled":
			// case 'includeChildren':
			case "log":
			case "showToolbar":
			// case 'report':
			// case 'alwaysShowLabels':
			case "showNotificationCount":
			case "dangerouslyForceRunInProduction":
			case "showFPS":
			case "allowInIframe":
				if (typeof value !== "boolean") {
					errors.push(`- ${key} must be a boolean. Got "${value}"`)
				} else {
					validOptions[key] = value
				}
				break
			// case 'renderCountThreshold':
			// case 'resetCountTimeout':
			//   if (typeof value !== 'number' || value < 0) {
			//     errors.push(`- ${key} must be a non-negative number. Got "${value}"`);
			//   } else {
			//     validOptions[key] = value as number;
			//   }
			//   break;
			case "animationSpeed":
				if (!["slow", "fast", "off"].includes(value as string)) {
					errors.push(
						`- Invalid animation speed "${value}". Using default "fast"`,
					)
				} else {
					validOptions[key] = value as "slow" | "fast" | "off"
				}
				break
			case "onCommitStart":
				if (typeof value !== "function") {
					errors.push(`- ${key} must be a function. Got "${value}"`)
				} else {
					validOptions.onCommitStart = value as () => void
				}
				break
			case "onCommitFinish":
				if (typeof value !== "function") {
					errors.push(`- ${key} must be a function. Got "${value}"`)
				} else {
					validOptions.onCommitFinish = value as () => void
				}
				break
			case "onRender":
				if (typeof value !== "function") {
					errors.push(`- ${key} must be a function. Got "${value}"`)
				} else {
					validOptions.onRender = value as (
						fiber: Fiber,
						renders: Array<Render>,
					) => void
				}
				break
			case "onPaintStart":
			case "onPaintFinish":
				if (typeof value !== "function") {
					errors.push(`- ${key} must be a function. Got "${value}"`)
				} else {
					validOptions[key] = value as (outlines: Array<Outline>) => void
				}
				break
			// case 'trackUnnecessaryRenders': {
			//   validOptions.trackUnnecessaryRenders =
			//     typeof value === 'boolean' ? value : false;
			//   break;
			// }
			// case 'smoothlyAnimateOutlines': {
			//   validOptions.smoothlyAnimateOutlines =
			//     typeof value === 'boolean' ? value : false;
			//   break;
			// }
			default:
				errors.push(`- Unknown option "${key}"`)
		}
	}

	if (errors.length > 0) {
		// biome-ignore lint/suspicious/noConsole: Intended debug output
		console.warn(`[React Scan] Invalid options:\n${errors.join("\n")}`)
	}

	return validOptions
}

export const setOptions = (userOptions: Partial<Options>) => {
	try {
		const validOptions = validateOptions(userOptions)

		if (Object.keys(validOptions).length === 0) {
			return
		}

		const shouldInitToolbar =
			"showToolbar" in validOptions && validOptions.showToolbar !== undefined

		const newOptions = {
			...ReactDevtoolInternals.options.value,
			...validOptions,
		}

		const { instrumentation } = ReactDevtoolInternals
		if (instrumentation && "enabled" in validOptions) {
			instrumentation.isPaused.value = validOptions.enabled === false
		}

		ReactDevtoolInternals.options.value = newOptions

		// temp hack since defaults override stored local storage values
		// we actually don't care about any other local storage option other than enabled, we should not be syncing those to local storage
		try {
			const existing = readLocalStorage<undefined | Record<string, unknown>>(
				"react-devtool-options",
			)?.enabled

			if (typeof existing === "boolean") {
				newOptions.enabled = existing
			}
		} catch (e) {
			if (ReactDevtoolInternals.options.value._debug === "verbose") {
				// biome-ignore lint/suspicious/noConsole: intended debug output
				console.error(
					"[React Scan Internal Error]",
					"Failed to create notifications outline canvas",
					e,
				)
			}
			/** */
		}

		saveLocalStorage("react-devtool-options", newOptions)

		if (shouldInitToolbar) {
			initToolbar(!!newOptions.showToolbar)
		}

		return newOptions
	} catch (e) {
		if (ReactDevtoolInternals.options.value._debug === "verbose") {
			// biome-ignore lint/suspicious/noConsole: intended debug output
			console.error(
				"[React Scan Internal Error]",
				"Failed to create notifications outline canvas",
				e,
			)
		}
		/** */
	}
}

const getOptions = () => ReactDevtoolInternals.options

// we only need to run this check once and will read the value in hot path
let isProduction: boolean | null = null
let rdtHook: ReturnType<typeof getRDTHook>
const getIsProduction = () => {
	if (isProduction !== null) {
		return isProduction
	}
	rdtHook ??= getRDTHook()
	for (const renderer of rdtHook.renderers.values()) {
		const buildType = detectReactBuildType(renderer)
		if (buildType === "production") {
			isProduction = true
		}
	}
	return isProduction
}

const start = () => {
	try {
		if (!IS_CLIENT) {
			return
		}

		// Load fonts early for shadow DOM compatibility
		loadOptimisticFonts()

		if (
			!ReactDevtoolInternals.runInAllEnvironments &&
			getIsProduction() &&
			!ReactDevtoolInternals.options.value.dangerouslyForceRunInProduction
		) {
			return
		}

		const localStorageOptions = readLocalStorage<LocalStorageOptions>(
			"react-devtool-options",
		)

		if (localStorageOptions) {
			const validLocalOptions = validateOptions(localStorageOptions)

			if (Object.keys(validLocalOptions).length > 0) {
				ReactDevtoolInternals.options.value = {
					...ReactDevtoolInternals.options.value,
					...validLocalOptions,
				}
			}
		}

		const options = getOptions()

		// initReactDevtoolInstrumentation(() => {
		initToolbar(!!options.value.showToolbar)
		// });

		if (!Store.monitor.value && IS_CLIENT) {
			setTimeout(() => {
				if (isInstrumentationActive()) return
				// biome-ignore lint/suspicious/noConsole: Intended debug output
				console.error(
					"[React Scan] Failed to load. Must import React Scan before React runs.",
				)
			}, 5000)
		}
	} catch (e) {
		if (ReactDevtoolInternals.options.value._debug === "verbose") {
			// biome-ignore lint/suspicious/noConsole: intended debug output
			console.error(
				"[React Scan Internal Error]",
				"Failed to create notifications outline canvas",
				e,
			)
		}
	}
}

const initToolbar = (showToolbar: boolean) => {
	window.reactDevtoolCleanupListeners?.()

	const cleanupTimingTracking = startTimingTracking()
	const cleanupOutlineCanvas = createNotificationsOutlineCanvas()

	window.reactDevtoolCleanupListeners = () => {
		cleanupTimingTracking()
		cleanupOutlineCanvas?.()
	}

	const windowToolbarContainer = window.__REACT_DEVTOOL_TOOLBAR_CONTAINER__

	if (!showToolbar) {
		windowToolbarContainer?.remove()
		return
	}

	windowToolbarContainer?.remove()
	const { shadowRoot } = initRootContainer()
	createToolbar(shadowRoot)
}

const createNotificationsOutlineCanvas = () => {
	try {
		const highlightRoot = document.documentElement
		return createHighlightCanvas(highlightRoot)
	} catch (e) {
		if (ReactDevtoolInternals.options.value._debug === "verbose") {
			// biome-ignore lint/suspicious/noConsole: intended debug output
			console.error(
				"[React Scan Internal Error]",
				"Failed to create notifications outline canvas",
				e,
			)
		}
	}
}

/**
 * @public
 */
export const scan = (options: Options = {}) => {
	setOptions(options)
	const isInIframe = Store.isInIframe.value

	if (
		isInIframe &&
		!ReactDevtoolInternals.options.value.allowInIframe &&
		!ReactDevtoolInternals.runInAllEnvironments
	) {
		return
	}

	if (options.enabled === false && options.showToolbar !== true) {
		return
	}

	start()
}

export const ignoredProps = new WeakSet<
	Exclude<ReactNode, undefined | null | string | number | boolean | bigint>
>()
