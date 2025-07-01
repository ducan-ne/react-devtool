import { setOptions } from "~core/index";
import { Devtool } from "./devtool";

setOptions({
	showFPS: false,
	// showToolbar: true,
});

export function App() {
	return (
		<>
			123
			<Devtool>Hello world</Devtool>
		</>
	);
}
