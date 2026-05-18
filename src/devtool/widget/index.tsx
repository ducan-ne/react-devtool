import { createContext, type JSX } from "preact"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { Store, ReactDevtoolInternals } from "~core/index"
import { cn, saveLocalStorage, removeLocalStorage, readLocalStorage } from "~web/utils/helpers"
import { Content } from "~web/views"
import { DevtoolOverlay } from "~web/views/inspector/overlay"
import {
  LOCALSTORAGE_KEY,
  LOCALSTORAGE_COLLAPSED_KEY,
  MIN_SIZE,
  SAFE_AREA,
  LOCALSTORAGE_LAST_VIEW_KEY,
} from "../constants"
import {
  defaultWidgetConfig,
  signalRefWidget,
  signalWidget,
  signalWidgetViews,
  saveWidgetSizeSession,
  updateDimensions,
  type WidgetStates,
} from "../state"
import { calculateBoundedSize, calculatePosition, getBestCorner } from "./helpers"
import { ResizeHandle } from "./resize-handle"
import { signalWidgetCollapsed } from "~web/state"
import { Icon } from "~web/components/icon"
import type { Corner } from "./types"
import type { CollapsedPosition } from "./types"

const COLLAPSED_SIZE = {
  horizontal: { width: 20, height: 48 },
  vertical: { width: 48, height: 20 },
} as const

export const Widget = () => {
  const refWidget = useRef<HTMLDivElement | null>(null)
  const refShouldOpen = useRef<boolean>(false)

  const refInitialMinimizedWidth = useRef<number>(0)
  const refInitialMinimizedHeight = useRef<number>(0)
  const refExpandingFromCollapsed = useRef<boolean>(false)

  const updateWidgetPosition = useCallback((shouldSave = true) => {
    if (!refWidget.current) return

    const { corner } = signalWidget.value
    let newWidth: number
    let newHeight: number

    if (signalWidgetCollapsed.value) {
      const orientation = signalWidgetCollapsed.value.orientation || "horizontal"
      const size = COLLAPSED_SIZE[orientation]
      newWidth = size.width
      newHeight = size.height
    } else if (refShouldOpen.current) {
      const lastDims = signalWidget.value.lastDimensions
      newWidth = calculateBoundedSize(lastDims.width, 0, true)
      newHeight = calculateBoundedSize(lastDims.height, 0, false)

      if (refExpandingFromCollapsed.current) {
        refExpandingFromCollapsed.current = false
      }
    } else {
      newWidth = refInitialMinimizedWidth.current
      newHeight = refInitialMinimizedHeight.current
    }

    const newPosition = calculatePosition(corner, newWidth, newHeight)

    // When collapsed, override position so arrow is flush against the viewport edge.
    let finalPosition = newPosition
    if (signalWidgetCollapsed.value) {
      const { corner: collapsedCorner, orientation = "horizontal" } = signalWidgetCollapsed.value
      const size = COLLAPSED_SIZE[orientation]

      switch (collapsedCorner) {
        case "top-left":
          finalPosition =
            orientation === "horizontal" ? { x: -1, y: SAFE_AREA } : { x: SAFE_AREA, y: -1 }
          break
        case "bottom-left":
          finalPosition =
            orientation === "horizontal"
              ? { x: -1, y: window.innerHeight - size.height - SAFE_AREA }
              : { x: SAFE_AREA, y: window.innerHeight - size.height + 1 }
          break
        case "top-right":
          finalPosition =
            orientation === "horizontal"
              ? { x: window.innerWidth - size.width + 1, y: SAFE_AREA }
              : { x: window.innerWidth - size.width - SAFE_AREA, y: -1 }
          break
        case "bottom-right":
        default:
          finalPosition =
            orientation === "horizontal"
              ? {
                  x: window.innerWidth - size.width + 1,
                  y: window.innerHeight - size.height - SAFE_AREA,
                }
              : {
                  x: window.innerWidth - size.width - SAFE_AREA,
                  y: window.innerHeight - size.height + 1,
                }
          break
      }
    }

    const isTooSmall = newWidth < MIN_SIZE.width || newHeight < MIN_SIZE.initialHeight
    const shouldPersist = shouldSave && !isTooSmall

    const container = refWidget.current
    const containerStyle = container.style

    let rafId: number | null = null
    const onTransitionEnd = () => {
      updateDimensions()
      container.removeEventListener("transitionend", onTransitionEnd)
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    container.addEventListener("transitionend", onTransitionEnd)
    containerStyle.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"

    rafId = requestAnimationFrame(() => {
      containerStyle.width = `${newWidth}px`
      containerStyle.height = `${newHeight}px`
      containerStyle.transform = `translate3d(${finalPosition.x}px, ${finalPosition.y}px, 0)`
      rafId = null
    })

    const newDimensions = {
      isFullWidth: newWidth >= window.innerWidth - SAFE_AREA * 2,
      isFullHeight: newHeight >= window.innerHeight - SAFE_AREA * 2,
      width: newWidth,
      height: newHeight,
      position: finalPosition,
    }

    signalWidget.value = {
      corner,
      dimensions: newDimensions,
      lastDimensions: refShouldOpen
        ? signalWidget.value.lastDimensions
        : newWidth > refInitialMinimizedWidth.current
          ? newDimensions
          : signalWidget.value.lastDimensions,
      componentsTree: signalWidget.value.componentsTree,
    }

    if (shouldPersist) {
      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: signalWidget.value.corner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions,
        componentsTree: signalWidget.value.componentsTree,
      })
      saveWidgetSizeSession(signalWidget.value)
    }

    updateDimensions()
  }, [])

  const refSuppressNextClick = useRef(false)
  const refClickSuppressCleanup = useRef<(() => void) | null>(null)
  const refRestoreDocumentCursor = useRef<(() => void) | null>(null)
  const [dragFeedback, setDragFeedback] = useState<"idle" | "pending" | "dragging">("idle")

  const suppressNextToolbarClick = useCallback(() => {
    refSuppressNextClick.current = true
    refClickSuppressCleanup.current?.()

    let timeoutId: number | null = null

    const cleanup = () => {
      document.removeEventListener("click", handleClick, true)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
      refClickSuppressCleanup.current = null
    }

    const handleClick = (clickEvent: MouseEvent) => {
      refSuppressNextClick.current = false
      clickEvent.preventDefault()
      clickEvent.stopPropagation()
      clickEvent.stopImmediatePropagation()
      cleanup()
    }

    refClickSuppressCleanup.current = cleanup
    document.addEventListener("click", handleClick, true)
    timeoutId = window.setTimeout(() => {
      refSuppressNextClick.current = false
      cleanup()
    }, 10_000)
  }, [])

  const restoreDocumentCursor = useCallback(() => {
    refRestoreDocumentCursor.current?.()
  }, [])

  const setDocumentDraggingCursor = useCallback(() => {
    refRestoreDocumentCursor.current?.()

    const body = document.body
    const root = document.documentElement
    const previousBodyCursor = body.style.cursor
    const previousRootCursor = root.style.cursor

    body.style.cursor = "grabbing"
    root.style.cursor = "grabbing"
    refRestoreDocumentCursor.current = () => {
      body.style.cursor = previousBodyCursor
      root.style.cursor = previousRootCursor
      refRestoreDocumentCursor.current = null
    }
  }, [])

  const startDrag = useCallback(
    (
      initialMouseX: number,
      initialMouseY: number,
      activationEvent?: globalThis.PointerEvent,
    ) => {
      if (!refWidget.current) return

      const container = refWidget.current
      const containerStyle = container.style
      const { dimensions } = signalWidget.value

      const initialX = dimensions.position.x
      const initialY = dimensions.position.y

      let currentX = initialX
      let currentY = initialY
      let rafId: number | null = null
      let hasMoved = false
      let lastMouseX = initialMouseX
      let lastMouseY = initialMouseY

      setDragFeedback("dragging")
      setDocumentDraggingCursor()

      const stopDraggingFeedback = () => {
        setDragFeedback("idle")
        restoreDocumentCursor()
      }

      const resetClickSuppressionSoon = () => {
        if (!refSuppressNextClick.current && !refClickSuppressCleanup.current) return
        window.setTimeout(() => {
          refSuppressNextClick.current = false
          refClickSuppressCleanup.current?.()
        }, 500)
      }

      const handlePointerMove = (e: globalThis.PointerEvent) => {
        if (rafId) return

        hasMoved = true
        lastMouseX = e.clientX
        lastMouseY = e.clientY

        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX
          const deltaY = lastMouseY - initialMouseY

          currentX = Number(initialX) + deltaX
          currentY = Number(initialY) + deltaY

          /* [CURSOR GENERATED] Anti-blur fix:
           * Changed from transition: 'all' and transform: translate() to:
           * 1. transition: none - Prevents interpolation blur during drag
           * 2. translate3d - Forces GPU acceleration for crisp text
           */
          containerStyle.transition = "none"
          containerStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`

          const widgetRight = currentX + dimensions.width
          const widgetBottom = currentY + dimensions.height

          const outsideLeft = Math.max(0, -currentX)
          const outsideRight = Math.max(0, widgetRight - window.innerWidth)
          const outsideTop = Math.max(0, -currentY)
          const outsideBottom = Math.max(0, widgetBottom - window.innerHeight)

          const horizontalOutside = Math.min(dimensions.width, outsideLeft + outsideRight)
          const verticalOutside = Math.min(dimensions.height, outsideTop + outsideBottom)
          const areaOutside =
            horizontalOutside * dimensions.height +
            verticalOutside * dimensions.width -
            horizontalOutside * verticalOutside
          const totalArea = dimensions.width * dimensions.height

          // todo: delete this doesn't do anything
          let shouldCollapse = areaOutside > totalArea * 0.35

          if (!shouldCollapse && ReactDevtoolInternals.options.value.showFPS) {
            const fpsRight = currentX + dimensions.width
            const fpsLeft = fpsRight - 100

            const fpsFullyOutside =
              fpsRight <= 0 ||
              fpsLeft >= window.innerWidth ||
              currentY + dimensions.height <= 0 ||
              currentY >= window.innerHeight

            shouldCollapse = fpsFullyOutside
          }

          if (shouldCollapse) {
            const widgetCenterX = currentX + dimensions.width / 2
            const widgetCenterY = currentY + dimensions.height / 2
            const screenCenterX = window.innerWidth / 2
            const screenCenterY = window.innerHeight / 2

            let targetCorner: Corner
            if (widgetCenterX < screenCenterX) {
              targetCorner = widgetCenterY < screenCenterY ? "top-left" : "bottom-left"
            } else {
              targetCorner = widgetCenterY < screenCenterY ? "top-right" : "bottom-right"
            }

            let orientation: "horizontal" | "vertical"
            const horizontalOverflow = Math.max(outsideLeft, outsideRight)
            const verticalOverflow = Math.max(outsideTop, outsideBottom)

            orientation = horizontalOverflow > verticalOverflow ? "horizontal" : "vertical"

            signalWidget.value = {
              ...signalWidget.value,
              corner: targetCorner,
              lastDimensions: {
                ...dimensions,
                position: calculatePosition(targetCorner, dimensions.width, dimensions.height),
              },
            }

            const collapsedPosition: CollapsedPosition = {
              corner: targetCorner,
              orientation,
            }

            signalWidgetCollapsed.value = collapsedPosition
            saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, collapsedPosition)
            saveLocalStorage(LOCALSTORAGE_KEY, signalWidget.value)
            saveWidgetSizeSession(signalWidget.value)
            updateWidgetPosition(false)
            resetClickSuppressionSoon()
            stopDraggingFeedback()

            document.removeEventListener("pointermove", handlePointerMove)
            document.removeEventListener("pointerup", handlePointerEnd)
            document.removeEventListener("pointercancel", handlePointerEnd)
            if (rafId) {
              cancelAnimationFrame(rafId)
              rafId = null
            }
          }

          rafId = null
        })
      }

      const handlePointerEnd = () => {
        if (!container) return

        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }

        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerEnd)
        document.removeEventListener("pointercancel", handlePointerEnd)
        resetClickSuppressionSoon()
        stopDraggingFeedback()

        // Calculate total movement distance
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX)
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY)
        const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

        // Only consider it a move if we moved more than 60 pixels
        if (!hasMoved || totalMovement < 60) return

        const newCorner = getBestCorner(
          lastMouseX,
          lastMouseY,
          initialMouseX,
          initialMouseY,
          Store.inspectState.value.kind === "focused" ? 80 : 40,
        )

        if (newCorner === signalWidget.value.corner) {
          /* [CURSOR GENERATED] Anti-blur fix:
           * Changed from transition: 'all' to transition: 'transform'
           * to prevent unnecessary property interpolation that was
           * causing text blur during animation
           */
          containerStyle.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          const currentPosition = signalWidget.value.dimensions.position
          requestAnimationFrame(() => {
            containerStyle.transform = `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`
          })

          return
        }

        const snappedPosition = calculatePosition(newCorner, dimensions.width, dimensions.height)

        if (currentX === initialX && currentY === initialY) return

        const onTransitionEnd = () => {
          containerStyle.transition = "none"
          updateDimensions()
          container.removeEventListener("transitionend", onTransitionEnd)
          if (rafId) {
            cancelAnimationFrame(rafId)
            rafId = null
          }
        }

        container.addEventListener("transitionend", onTransitionEnd)
        containerStyle.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"

        requestAnimationFrame(() => {
          containerStyle.transform = `translate3d(${snappedPosition.x}px, ${snappedPosition.y}px, 0)`
        })

        signalWidget.value = {
          corner: newCorner,
          dimensions: {
            isFullWidth: dimensions.isFullWidth,
            isFullHeight: dimensions.isFullHeight,
            width: dimensions.width,
            height: dimensions.height,
            position: snappedPosition,
          },
          lastDimensions: signalWidget.value.lastDimensions,
          componentsTree: signalWidget.value.componentsTree,
        }

        saveLocalStorage(LOCALSTORAGE_KEY, {
          corner: newCorner,
          dimensions: signalWidget.value.dimensions,
          lastDimensions: signalWidget.value.lastDimensions,
          componentsTree: signalWidget.value.componentsTree,
        })
        saveWidgetSizeSession(signalWidget.value)
      }

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerEnd)
      document.addEventListener("pointercancel", handlePointerEnd)
      if (activationEvent) {
        handlePointerMove(activationEvent)
      }
    },
    [restoreDocumentCursor, setDocumentDraggingCursor],
  )

  const handleDrag = useCallback(
    (e: JSX.TargetedPointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      const shouldUseLongPress = Boolean(target.closest("button"))
      const isTextInput = Boolean(
        target.closest('input, textarea, select, [contenteditable="true"]'),
      )

      if (!refWidget.current || isTextInput) return

      if (!shouldUseLongPress) {
        e.preventDefault()
        startDrag(e.clientX, e.clientY)
        return
      }

      const initialMouseX = e.clientX
      const initialMouseY = e.clientY
      let longPressTimeout: number | null = null
      let feedbackTimeout: number | null = null
      let didActivateDrag = false
      let lastPendingPointerEvent: globalThis.PointerEvent | undefined

      const cleanupPendingLongPress = () => {
        if (longPressTimeout !== null) {
          window.clearTimeout(longPressTimeout)
          longPressTimeout = null
        }
        if (feedbackTimeout !== null) {
          window.clearTimeout(feedbackTimeout)
          feedbackTimeout = null
        }
        document.removeEventListener("pointermove", handlePendingPointerMove)
        document.removeEventListener("pointerup", handlePendingPointerEnd)
        document.removeEventListener("pointercancel", handlePendingPointerEnd)
        if (!didActivateDrag) {
          setDragFeedback("idle")
        }
      }

      const activateLongPressDrag = (activationEvent?: globalThis.PointerEvent) => {
        if (didActivateDrag) return

        didActivateDrag = true
        suppressNextToolbarClick()
        cleanupPendingLongPress()
        startDrag(initialMouseX, initialMouseY, activationEvent)
      }

      const handlePendingPointerMove = (moveEvent: globalThis.PointerEvent) => {
        lastPendingPointerEvent = moveEvent
      }

      const handlePendingPointerEnd = () => {
        cleanupPendingLongPress()
      }

      feedbackTimeout = window.setTimeout(() => {
        if (!didActivateDrag) {
          setDragFeedback("pending")
        }
      }, 300)
      longPressTimeout = window.setTimeout(() => {
        activateLongPressDrag(lastPendingPointerEvent)
      }, 800)
      document.addEventListener("pointermove", handlePendingPointerMove, { passive: true })
      document.addEventListener("pointerup", handlePendingPointerEnd)
      document.addEventListener("pointercancel", handlePendingPointerEnd)
    },
    [startDrag, suppressNextToolbarClick],
  )

  const handleToolbarClickCapture = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (!refSuppressNextClick.current) return

    refSuppressNextClick.current = false
    refClickSuppressCleanup.current?.()
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleCollapsedDrag = useCallback((e: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (!refWidget.current || !signalWidgetCollapsed.value) return

    const { corner: collapsedCorner, orientation = "horizontal" } = signalWidgetCollapsed.value

    const initialMouseX = e.clientX
    const initialMouseY = e.clientY

    let rafId: number | null = null
    let hasExpanded = false

    const DRAG_THRESHOLD = 50

    const handlePointerMove = (e: globalThis.PointerEvent) => {
      if (hasExpanded || rafId) return

      const deltaX = e.clientX - initialMouseX
      const deltaY = e.clientY - initialMouseY

      let shouldExpand = false

      if (orientation === "horizontal") {
        if (collapsedCorner.endsWith("left") && deltaX > DRAG_THRESHOLD) {
          shouldExpand = true
        } else if (collapsedCorner.endsWith("right") && deltaX < -DRAG_THRESHOLD) {
          shouldExpand = true
        }
      } else {
        if (collapsedCorner.startsWith("top") && deltaY > DRAG_THRESHOLD) {
          shouldExpand = true
        } else if (collapsedCorner.startsWith("bottom") && deltaY < -DRAG_THRESHOLD) {
          shouldExpand = true
        }
      }

      if (shouldExpand) {
        hasExpanded = true

        signalWidgetCollapsed.value = null
        saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, null)

        if (refInitialMinimizedWidth.current === 0 && refWidget.current) {
          requestAnimationFrame(() => {
            if (refWidget.current) {
              refWidget.current.style.width = "min-content"
              const naturalWidth = refWidget.current.offsetWidth
              refInitialMinimizedWidth.current = naturalWidth || 300

              const lastDims = signalWidget.value.lastDimensions
              const targetWidth = calculateBoundedSize(lastDims.width, 0, true)
              const targetHeight = calculateBoundedSize(lastDims.height, 0, false)

              let newX = e.clientX - targetWidth / 2
              let newY = e.clientY - targetHeight / 2

              newX = Math.max(
                SAFE_AREA,
                Math.min(newX, window.innerWidth - targetWidth - SAFE_AREA),
              )
              newY = Math.max(
                SAFE_AREA,
                Math.min(newY, window.innerHeight - targetHeight - SAFE_AREA),
              )

              signalWidget.value = {
                ...signalWidget.value,
                dimensions: {
                  ...signalWidget.value.dimensions,
                  position: { x: newX, y: newY },
                },
              }

              updateWidgetPosition(true)

              const savedView = readLocalStorage<WidgetStates>(LOCALSTORAGE_LAST_VIEW_KEY)
              signalWidgetViews.value = savedView || { view: "none" }

              setTimeout(() => {
                if (refWidget.current) {
                  const dragEvent = new PointerEvent("pointerdown", {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    pointerId: e.pointerId,
                    bubbles: true,
                  })
                  refWidget.current.dispatchEvent(dragEvent)
                }
              }, 100)
            }
          })
        } else {
          updateWidgetPosition(true)
          const savedView = readLocalStorage<WidgetStates>(LOCALSTORAGE_LAST_VIEW_KEY)
          signalWidgetViews.value = savedView || { view: "none" }
        }

        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerEnd)
      }
    }

    const handlePointerEnd = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerEnd)
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerEnd)
  }, [])

  const expandCollapsedToolbar = useCallback(() => {
    signalWidgetCollapsed.value = null
    saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, null)

    if (refInitialMinimizedWidth.current === 0 && refWidget.current) {
      requestAnimationFrame(() => {
        if (!refWidget.current) return
        refWidget.current.style.width = "min-content"
        const naturalWidth = refWidget.current.offsetWidth
        refInitialMinimizedWidth.current = naturalWidth || 300
        updateWidgetPosition(true)
      })
    } else {
      updateWidgetPosition(true)
    }

    const savedView = readLocalStorage<WidgetStates>(LOCALSTORAGE_LAST_VIEW_KEY)
    signalWidgetViews.value = savedView || { view: "none" }
  }, [updateWidgetPosition])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        return
      }

      if (event.key === "Escape") {
        const inspectStateKind = Store.inspectState.value.kind
        const isInspectActive =
          inspectStateKind !== "inspect-off" && inspectStateKind !== "uninitialized"
        if (signalWidgetViews.value.view === "none" && !isInspectActive) return

        event.preventDefault()
        signalWidgetViews.value = { view: "none" }

        if (isInspectActive) {
          Store.inspectState.value = { kind: "inspect-off" }
        }

        return
      }

      if (!(event.altKey && event.code === "KeyR")) return

      event.preventDefault()
      if (signalWidgetCollapsed.value) {
        expandCollapsedToolbar()
        return
      }

      if (Store.inspectState.value.kind !== "inspect-off") {
        Store.inspectState.value = { kind: "inspect-off" }
      }

      signalWidgetViews.value =
        signalWidgetViews.value.view === "none" ? { view: "notifications" } : { view: "none" }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [expandCollapsedToolbar])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    if (!refWidget.current) return

    removeLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY)

    if (!signalWidgetCollapsed.value) {
      refWidget.current.style.width = "min-content"
      refInitialMinimizedHeight.current = 36 // height of the header
      refInitialMinimizedWidth.current = refWidget.current.offsetWidth
    } else {
      refInitialMinimizedHeight.current = 36
      refInitialMinimizedWidth.current = 0
    }

    refWidget.current.style.maxWidth = `calc(100vw - ${SAFE_AREA * 2}px)`
    refWidget.current.style.maxHeight = `calc(100vh - ${SAFE_AREA * 2}px)`

    updateWidgetPosition()

    if (
      Store.inspectState.value.kind !== "focused" &&
      !signalWidgetCollapsed.value &&
      !refExpandingFromCollapsed.current
    ) {
      signalWidget.value = {
        ...signalWidget.value,
        dimensions: {
          isFullWidth: false,
          isFullHeight: false,
          width: refInitialMinimizedWidth.current,
          height: refInitialMinimizedHeight.current,
          position: signalWidget.value.dimensions.position,
        },
      }
    }

    signalRefWidget.value = refWidget.current

    const unsubscribeSignalWidget = signalWidget.subscribe((widget) => {
      if (!refWidget.current) return

      const { x, y } = widget.dimensions.position
      const { width, height } = widget.dimensions
      const container = refWidget.current

      requestAnimationFrame(() => {
        container.style.transform = `translate3d(${x}px, ${y}px, 0)`
        container.style.width = `${width}px`
        container.style.height = `${height}px`
      })
    })

    const unsubscribeSignalWidgetViews = signalWidgetViews.subscribe((state) => {
      refShouldOpen.current = state.view !== "none"
      updateWidgetPosition()

      if (!signalWidgetCollapsed.value) {
        if (state.view !== "none") {
          saveLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY, state)
        } else {
          removeLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY)
        }
      }
    })

    const unsubscribeStoreInspectState = Store.inspectState.subscribe((state) => {
      refShouldOpen.current = state.kind === "focused"
      updateWidgetPosition()
    })

    const handleWindowResize = () => {
      updateWidgetPosition(true)
    }

    window.addEventListener("resize", handleWindowResize, { passive: true })

    return () => {
      window.removeEventListener("resize", handleWindowResize)
      unsubscribeSignalWidgetViews()
      unsubscribeStoreInspectState()
      unsubscribeSignalWidget()
      refClickSuppressCleanup.current?.()
      restoreDocumentCursor()

      saveLocalStorage(LOCALSTORAGE_KEY, {
        ...defaultWidgetConfig,
        corner: signalWidget.value.corner,
      })
    }
  }, [])

  // i don't want to put the ref in state, so this is the solution to force context to propagate it
  const [_, setTriggerRender] = useState(false)
  useEffect(() => {
    setTriggerRender(true)
  }, [])

  const isCollapsed = signalWidgetCollapsed.value

  let arrowRotationClass = ""
  if (isCollapsed) {
    const { orientation = "horizontal", corner } = isCollapsed
    if (orientation === "horizontal") {
      arrowRotationClass = corner?.endsWith("right") ? "rotate-180" : ""
    } else {
      arrowRotationClass = corner?.startsWith("bottom") ? "-rotate-90" : "rotate-90"
    }
  }

  return (
    <>
      <DevtoolOverlay />
      <ToolbarElementContext.Provider value={refWidget.current}>
        <div
          id="react-devtool-toolbar"
          dir="ltr"
          ref={refWidget}
          onPointerDown={!isCollapsed ? handleDrag : handleCollapsedDrag}
          onClickCapture={handleToolbarClickCapture}
          className={cn(
            "fixed inset-0",
            isCollapsed
              ? (() => {
                  const { orientation = "horizontal", corner } = isCollapsed
                  if (orientation === "horizontal") {
                    return corner?.endsWith("right")
                      ? "rounded-tl-lg rounded-bl-lg shadow-lg"
                      : "rounded-tr-lg rounded-br-lg shadow-lg"
                  } else {
                    return corner?.startsWith("bottom")
                      ? "rounded-tl-lg rounded-tr-lg shadow-lg"
                      : "rounded-bl-lg rounded-br-lg shadow-lg"
                  }
                })()
              : "rounded-lg shadow-lg",
            "flex flex-col",
            "font-mono text-[13px]",
            "user-select-none",
            "opacity-0",
            isCollapsed ? "react-devtool-collapsed cursor-pointer" : "cursor-grab",
            dragFeedback === "pending" && "react-devtool-drag-pending",
            dragFeedback === "dragging" && "react-devtool-dragging cursor-grabbing",
            "z-[124124124124]",
            "animate-fade-in animation-duration-300 animation-delay-300",
            "will-change-transform",
            "[touch-action:none]",
          )}
        >
          {/* this entire feature is vibe coded don't think too hard about the code its probably very non coherent */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={expandCollapsedToolbar}
              className="flex items-center justify-center w-full h-full text-white"
              title="Expand toolbar (Alt+R)"
            >
              <Icon
                name="icon-chevron-right"
                size={16}
                className={cn("transition-transform", arrowRotationClass)}
              />
            </button>
          ) : (
            <>
              <ResizeHandle position="top" />
              <ResizeHandle position="bottom" />
              <ResizeHandle position="left" />
              <ResizeHandle position="right" />
              <ResizeHandle position="top-left" />
              <ResizeHandle position="top-right" />
              <ResizeHandle position="bottom-left" />
              <ResizeHandle position="bottom-right" />
              <Content />
            </>
          )}
        </div>
      </ToolbarElementContext.Provider>
    </>
  )
}

const ToolbarElementContext = createContext<HTMLElement | null>(null)
