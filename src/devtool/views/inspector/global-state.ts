import { flashManager } from "./flash-overlay"
import { timelineActions } from "./states"
import { resetTracking } from "./timeline/utils"

export const globalInspectorState = {
	lastRendered: new Map<string, unknown>(),
	expandedPaths: new Set<string>(),
	cleanup: () => {
		globalInspectorState.lastRendered.clear()
		globalInspectorState.expandedPaths.clear()
		flashManager.cleanupAll()
		resetTracking()
		timelineActions.reset()
	},
}
