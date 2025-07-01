import { useEffect, type ReactNode } from "react";
import { scan } from "~core/index";
import { userChildren } from "~web/state";

type DevtoolProps = {
	children: ReactNode;
};

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
