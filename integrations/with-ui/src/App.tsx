import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Devtool, flags } from "react-devtool";
import {
	Button,
	FeatureFlags,
	Section,
	Tabs,
	Tab,
	Input,
	Select,
	Toggle,
	Radio,
	RadioGroup,
	ButtonGroup,
	Inspector,
	CodeBlock,
	useFlag,
} from "react-devtool/ui";

// Sample data for Inspector
const inspectorData = {
	user: {
		id: 123,
		name: "John Doe",
		email: "john@example.com",
		preferences: {
			theme: "dark",
			notifications: true,
			language: "en",
		},
	},
	session: {
		token: "abc123",
		expires: new Date(),
		permissions: ["read", "write", "admin"],
	},
};

const featureFlags = flags({
	darkMode: true,
	experimentalFeatures: false,
	debugMode: true,
	betaUI: false,
	autoSave: true,
});

function SubscribeToFlags() {
	const darkMode = useFlag(featureFlags, "darkMode");

	return (
		<div data-testid="dark-mode-value">
			Dark mode: {darkMode ? "ON" : "OFF"}
		</div>
	);
}

function App() {
	const [count, setCount] = useState(0);
	const [inputValue, setInputValue] = useState("");
	const [selectValue, setSelectValue] = useState("");
	const [toggleValue, setToggleValue] = useState(false);
	const [radioValue, setRadioValue] = useState("option1");

	// Feature flags signal for FeatureFlags component
	return (
		<>
			<SubscribeToFlags />
			<div>
				<a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noopener noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Vite + React</h1>
			<div className="card">
				<button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and React logos to learn more
			</p>
			<Devtool>
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-white mb-4">
						React Devtool UI Components Demo
					</h2>

					{/* Tabs Container */}
					<Tabs defaultValue="demo">
						<Tab label="Components Demo" value="demo">
							<div className="space-y-6">
								{/* Buttons Section */}
								<Section title="Buttons" collapsible defaultCollapsed={false}>
									<div className="space-y-3">
										<div className="flex gap-2 flex-wrap">
											<Button variant="default">Default</Button>
											<Button variant="outline">Outline</Button>
											<Button variant="ghost">Ghost</Button>
											<Button variant="destructive">Destructive</Button>
										</div>
										<div className="flex gap-2 flex-wrap">
											<Button size="sm">Small</Button>
											<Button size="default">Default</Button>
											<Button size="lg">Large</Button>
										</div>
										<ButtonGroup>
											<Button variant="outline">First</Button>
											<Button variant="outline">Second</Button>
											<Button variant="outline">Third</Button>
										</ButtonGroup>
									</div>
								</Section>

								{/* Form Controls Section */}
								<Section title="Form Controls" collapsible>
									<div className="space-y-4">
										<Input
											label="Sample Input"
											placeholder="Type something..."
											value={inputValue}
											onChange={(e) => setInputValue(e.target.value)}
											helpText="This is a help text"
										/>

										<Select
											label="Sample Select"
											value={selectValue}
											onChange={(e) => setSelectValue(e.target.value)}
											placeholder="Choose an option"
										>
											<option value="option1">Option 1</option>
											<option value="option2">Option 2</option>
											<option value="option3">Option 3</option>
										</Select>

										<div className="flex items-center justify-between">
											<label className="text-sm text-neutral-300">
												Toggle Switch
											</label>
											<Toggle checked={toggleValue} onChange={setToggleValue} />
										</div>

										<RadioGroup
											label="Radio Options"
											value={radioValue}
											onChange={setRadioValue}
										>
											<Radio label="Option 1" value="option1" />
											<Radio label="Option 2" value="option2" />
											<Radio label="Option 3" value="option3" />
										</RadioGroup>
									</div>
								</Section>

								{/* Code Block Section */}
								<Section title="Code Display" collapsible>
									<CodeBlock
										title="Sample TypeScript Code"
										language="typescript"
									>
										{`function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`}
									</CodeBlock>
								</Section>
							</div>
						</Tab>

						<Tab label="Feature Flags" value="flags">
							<FeatureFlags
								name="Application Features"
								values={featureFlags}
								onChange={(key, value) => {
									featureFlags.value = {
										...featureFlags.value,
										[key]: value,
									};
								}}
							/>
						</Tab>

						<Tab label="Data Inspector" value="inspector">
							<Section title="Object Inspector">
								<Inspector data={inspectorData} expandLevel={2} />
							</Section>
						</Tab>

						<Tab label="Nested Sections" value="sections">
							<Section title="Main Section" collapsible>
								<p className="text-neutral-300 text-sm mb-4">
									This demonstrates nested collapsible sections using semantic
									HTML.
								</p>

								<Section
									title="Subsection 1"
									collapsible
									defaultCollapsed={true}
								>
									<p className="text-neutral-400 text-xs">
										Content for subsection 1. This section starts collapsed.
									</p>
								</Section>

								<Section title="Subsection 2" collapsible>
									<div className="space-y-2">
										<p className="text-neutral-400 text-xs">
											Content for subsection 2.
										</p>
										<Button size="sm" variant="outline">
											Action Button
										</Button>
									</div>
								</Section>

								<Section title="Non-collapsible Section">
									<p className="text-neutral-400 text-xs">
										This section cannot be collapsed.
									</p>
								</Section>
							</Section>
						</Tab>
					</Tabs>

					{/* Status Display */}
					<div className="border-t border-neutral-600 pt-4 mt-6">
						<h3 className="text-sm font-medium text-neutral-300 mb-2">
							Current State:
						</h3>
						<div className="text-xs text-neutral-400 space-y-1">
							<div>Input: "{inputValue || "empty"}"</div>
							<div>Select: "{selectValue || "none selected"}"</div>
							<div>Toggle: {toggleValue ? "ON" : "OFF"}</div>
							<div>Radio: {radioValue}</div>
						</div>
					</div>
				</div>
			</Devtool>
		</>
	);
}

export default App;
