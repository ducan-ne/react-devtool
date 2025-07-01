import { useState } from "preact/hooks";
import { Test } from "./test";
import { SampleReact } from "./react/sample";
import { Widget } from "~web/widget";
import { SvgSprite } from "~web/components/svg-sprite";
import { ToolbarErrorBoundary } from "~web/toolbar";
import { setOptions } from "~core/index";

setOptions({
	showFPS: false,
	showToolbar: true,
});

export function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<Test>
				<SampleReact />
			</Test>
			{/* <ToolbarErrorBoundary>
				<SvgSprite />
				<Widget />
			</ToolbarErrorBoundary> */}
			,
		</>
	);
}
