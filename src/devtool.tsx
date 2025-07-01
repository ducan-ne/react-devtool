import { ToolbarErrorBoundary } from "~web/toolbar";
import { SvgSprite } from "~web/components/svg-sprite";
import { Widget } from "~web/widget";
import { useEffect } from "react";
import { scan } from "~core/index";

type DevtoolProps = {
	// biome-ignore lint/suspicious/noExplicitAny: any is fine here
	children: any;
};

export const Devtool = ({ children }: DevtoolProps) => {
	useEffect(() => {
		scan({
			enabled: true,
			showToolbar: true,
			showFPS: false,
		});
	}, []);
	return null;
};
