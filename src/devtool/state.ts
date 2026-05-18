import { signal } from "@preact/signals"
import {
  LOCALSTORAGE_KEY,
  MIN_CONTAINER_WIDTH,
  MIN_SIZE,
  SAFE_AREA,
  LOCALSTORAGE_COLLAPSED_KEY,
  SESSIONSTORAGE_SIZE_KEY,
} from "./constants"
import { IS_CLIENT } from "./utils/constants"
import {
  readLocalStorage,
  readSessionStorage,
  saveLocalStorage,
  saveSessionStorage,
} from "./utils/helpers"
import type { Corner, WidgetConfig, WidgetSettings } from "./widget/types"
import type { CollapsedPosition } from "./widget/types"

export const signalIsSettingsOpen = /* @__PURE__ */ signal(false)
export const signalRefWidget = /* @__PURE__ */ signal<HTMLDivElement | null>(null)

export const defaultWidgetConfig = {
  corner: "bottom-right" as Corner,
  dimensions: {
    isFullWidth: false,
    isFullHeight: false,
    width: MIN_SIZE.width,
    height: MIN_SIZE.height,
    position: { x: SAFE_AREA, y: SAFE_AREA },
  },
  lastDimensions: {
    isFullWidth: false,
    isFullHeight: false,
    width: MIN_SIZE.width,
    height: MIN_SIZE.height,
    position: { x: SAFE_AREA, y: SAFE_AREA },
  },
  componentsTree: {
    width: MIN_CONTAINER_WIDTH,
  },
} as WidgetConfig

type WidgetSizeSession = Pick<
  WidgetSettings,
  "dimensions" | "lastDimensions" | "componentsTree"
>

const getInitialWidgetConfig = (): WidgetConfig => {
  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY)
  const storedSize = readSessionStorage<WidgetSizeSession>(SESSIONSTORAGE_SIZE_KEY)

  if (!stored) {
    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: defaultWidgetConfig.corner,
      dimensions: defaultWidgetConfig.dimensions,
      lastDimensions: defaultWidgetConfig.lastDimensions,
      componentsTree: defaultWidgetConfig.componentsTree,
    })

    return {
      ...defaultWidgetConfig,
      dimensions: storedSize?.dimensions ?? defaultWidgetConfig.dimensions,
      lastDimensions: storedSize?.lastDimensions ?? defaultWidgetConfig.lastDimensions,
      componentsTree: storedSize?.componentsTree ?? defaultWidgetConfig.componentsTree,
    }
  }

  return {
    corner: stored.corner ?? defaultWidgetConfig.corner,
    dimensions: storedSize?.dimensions ?? stored.dimensions ?? defaultWidgetConfig.dimensions,

    lastDimensions:
      storedSize?.lastDimensions ??
      stored.lastDimensions ??
      stored.dimensions ??
      defaultWidgetConfig.lastDimensions,
    componentsTree:
      storedSize?.componentsTree ?? stored.componentsTree ?? defaultWidgetConfig.componentsTree,
  }
}

export const signalWidget = signal<WidgetConfig>(getInitialWidgetConfig())

export const saveWidgetSizeSession = (widget: WidgetConfig): void => {
  saveSessionStorage<WidgetSizeSession>(SESSIONSTORAGE_SIZE_KEY, {
    dimensions: widget.dimensions,
    lastDimensions: widget.lastDimensions,
    componentsTree: widget.componentsTree,
  })
}

export const setDefaultWidgetCorner = (corner: Corner): void => {
  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY)
  if (stored) return

  defaultWidgetConfig.corner = corner
  signalWidget.value = {
    ...signalWidget.value,
    corner,
  }
}

export const updateDimensions = (): void => {
  if (!IS_CLIENT) return

  const { dimensions } = signalWidget.value
  const { width, height, position } = dimensions

  signalWidget.value = {
    ...signalWidget.value,
    dimensions: {
      isFullWidth: width >= window.innerWidth - SAFE_AREA * 2,
      isFullHeight: height >= window.innerHeight - SAFE_AREA * 2,
      width,
      height,
      position,
    },
  }
}

export interface WidgetStates {
  view: "inspector" | "settings" | "notifications" | "none"
  data?: unknown
}

export const signalWidgetViews = signal<WidgetStates>({ view: "none" })

const storedCollapsed = readLocalStorage<CollapsedPosition | null>(LOCALSTORAGE_COLLAPSED_KEY)
export const signalWidgetCollapsed = /* @__PURE__ */ signal<CollapsedPosition | null>(
  storedCollapsed ?? null,
)

// biome-ignore lint/suspicious/noExplicitAny: This will hold React elements
export const userChildren = signal<any>(null)
