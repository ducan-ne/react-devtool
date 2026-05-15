import { Component } from "preact"
import {} from "preact/hooks"

import { Icon } from "~web/components/icon"
import {} from "./utils"
import { globalInspectorState } from "./global-state"

export { globalInspectorState }

// todo: add reset button and error message
export class InspectorErrorBoundary extends Component {
	state: { error: Error | null; hasError: boolean } = {
		hasError: false,
		error: null,
	}

	static getDerivedStateFromError(e: Error) {
		return { hasError: true, error: e }
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null })
		globalInspectorState.cleanup()
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="p-4 bg-red-950/50 h-screen backdrop-blur-sm">
					<div className="flex items-center gap-2 mb-3 text-red-400 font-medium">
						<Icon name="icon-flame" className="text-red-500" size={16} />
						Something went wrong in the inspector
					</div>
					<div className="p-3 bg-black/40 rounded font-mono text-xs text-red-300 mb-4 break-words">
						{this.state.error?.message || JSON.stringify(this.state.error)}
					</div>
					<button
						type="button"
						onClick={this.handleReset}
						className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
					>
						Reset Inspector
					</button>
				</div>
			)
		}

		return this.props.children
	}
}
