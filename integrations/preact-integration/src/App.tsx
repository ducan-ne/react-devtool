import { useState } from "preact/hooks";
import { Devtool } from "react-devtool";
import preactLogo from "./assets/preact.svg";
import viteLogo from "/vite.svg";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://preactjs.com" target="_blank" rel="noopener noreferrer">
					<img src={preactLogo} className="logo preact" alt="Preact logo" />
				</a>
			</div>
			<h1>Vite + Preact</h1>
			<div className="card">
				<button type="button" onClick={() => setCount((value) => value + 1)}>
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and Preact logos to learn more
			</p>
			<Devtool>
				<div data-testid="preact-hello-world">Hello from Preact</div>
			</Devtool>
		</>
	);
}

export default App;
