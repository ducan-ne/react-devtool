import { useEffect, useRef, type ReactNode } from "react"
import { initDevtool } from "@devtool/core/index"
import { userChildren } from "@devtool/state"
import { mountWindowFlags, unmountWindowFlags } from "./window-flags"
export {
	flags,
	useFlag,
	values,
	type FlagOptions,
	type FlagPersistHydrateStrategy,
	type FlagPersistOptions,
	type FlagSet,
	type Subscribable,
} from "./flags"
export type { Flags, WindowFlagsApi } from "./window-flags"

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

type DevtoolProps = {
  children: ReactNode
  toolbarPlacement?: Corner
}

export function abc() {
  return 123
}

/**
 * @public
 */
export const Devtool = ({ children, toolbarPlacement }: DevtoolProps) => {
  const cleanupTokenRef = useRef(0)

  // Initialize devtool lifecycle once.
  useEffect(() => {
    initDevtool({
      enabled: true,
      showToolbar: true,
      showFPS: false,
      dangerouslyForceRunInProduction: true,
      ...(toolbarPlacement ? { toolbarPlacement } : {}),
    })
    mountWindowFlags()

    return () => {
      unmountWindowFlags()
      initDevtool({ enabled: false })
    }
  }, [toolbarPlacement])

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
