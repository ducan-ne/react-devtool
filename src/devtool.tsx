import { useEffect, type ReactNode } from "react";
import { scan } from "./devtool/core/index";
import { userChildren } from "./devtool/state";

type DevtoolProps = {
	children: ReactNode;
};

/**
 * @public
 */
export const Devtool = ({ children }: DevtoolProps) => {
	useEffect(() => {
		scan({
			enabled: true,
			showToolbar: true,
			showFPS: false,
		});

		userChildren.value = children;

		return () => {
			userChildren.value = null;
		};
	}, [children]);

	// This component only sets up the devtool and doesn't render anything itself.
	return null;
};

/**
 * @public
 */
export { signal as createValues } from "@preact/signals";

/**
 * @public
 */
export { signal as createFlags } from "@preact/signals";
