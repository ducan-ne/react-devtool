import { useEffect, useMemo, useRef, useState } from "react"
import { Devtool, flags, useFlag } from "./devtool"
import {
	Button,
	CodeBlock,
	Divider,
	FeatureFlags,
	Group,
	Input,
	Inspector,
	Tab,
	Tabs,
	Toggle,
} from "./ui"

type FlagKey = "showDebugLabels" | "verboseLogs"

type CodeLanguage = "bash" | "tsx"

export function Timer({ onCallback }: { onCallback: () => void }) {
	const [seconds, setSeconds] = useState(0)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setSeconds((prev) => prev + 1)
		}, 1000)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [])

	const handleReset = () => {
		setSeconds(0)
		onCallback()
	}

	return (
		<div>
			<div>
				Timer: {seconds} second{seconds !== 1 ? "s" : ""}
			</div>
			<button type="button" onClick={handleReset}>
				Reset
			</button>
		</div>
	)
}

const getShikiHighlighter = (() => {
	let highlighterPromise:
		| Promise<Awaited<ReturnType<typeof import("shiki/core").createHighlighterCore>>>
		| undefined

	return () => {
		highlighterPromise ??= Promise.all([
			import("shiki/core"),
			import("shiki/engine/javascript"),
			import("shiki/dist/themes/github-dark.mjs"),
			import("shiki/dist/langs/tsx.mjs"),
			import("shiki/dist/langs/bash.mjs"),
		]).then(([core, engine, githubDark, tsx, bash]) =>
			core.createHighlighterCore({
				themes: [githubDark.default],
				langs: [tsx.default, bash.default],
				engine: engine.createJavaScriptRegexEngine(),
			}),
		)

		return highlighterPromise
	}
})()

async function highlightCode(code: string, language: CodeLanguage) {
	const highlighter = await getShikiHighlighter()
	return highlighter.codeToHtml(code, {
		lang: language,
		theme: "github-dark",
	})
}

const demoFlags = flags<Record<string, boolean>>(
	{
		showDebugLabels: true,
		verboseLogs: false,
	},
	{ persist: "demo" },
)

const installCommand = "npm install react-devtool"

const quickStartCode = `import { Devtool } from "react-devtool";

export function App() {
  return (
    <>
      <YourApp />
      <Devtool>
        <div>Internal tools go here</div>
      </Devtool>
    </>
  );
}`

const flagCode = `import { Devtool, flags, useFlag } from "react-devtool";
import { FeatureFlags } from "react-devtool/ui";

const featureFlags = flags(
  { newCheckout: false },
  { persist: "checkout" },
);

function Checkout() {
  const enabled = useFlag(featureFlags, "newCheckout");
  return enabled ? <NewCheckout /> : <LegacyCheckout />;
}`

const agentFlagCode = `import { Devtool, flags, useFlag } from "react-devtool";
import { FeatureFlags } from "react-devtool/ui";

const rolloutFlags = flags(
  { agentSearch: false },
  { persist: "agent-rollouts" },
);

function SearchPage() {
  const agentSearch = useFlag(rolloutFlags, "agentSearch");
  return agentSearch ? <AgentSearch /> : <ClassicSearch />;
}

<Devtool>
  <FeatureFlags name="Agent rollouts" values={rolloutFlags} />
</Devtool>;`

const uiCode = `import { Button, Divider, Group, Inspector } from "react-devtool/ui";

<Devtool>
  <Group title="Session" description="Current signed-in user and request context.">
    <Inspector data={session} expandLevel={2} />
    <Divider />
    <Button onClick={refreshSession}>Refresh</Button>
  </Group>
</Devtool>`

const features = [
	"Requires one component near your app root",
	"Shows your own debug UI through an in-page toolbar",
	"Pairs agent-built changes with feature flags, data, controls, and code blocks",
]

const agentWorkflow = [
	[
		"1",
		"Land disabled",
		"Ask the agent to keep the new path behind a default-off flag.",
	],
	[
		"2",
		"Review normally",
		"Use PR review and CI for code quality; use flags for runtime exposure.",
	],
	[
		"3",
		"Toggle in-app",
		"Flip the flag locally, in QA, or during demos from the devtool panel.",
	],
	[
		"4",
		"Roll out gradually",
		"Enable a small group first, fix bugs, then widen until the flag can go away.",
	],
] as const

const apiRows = [
	["Devtool", "Mounts the floating toolbar and renders your custom panel."],
	["flags(initial, options?)", "Creates a subscribable feature flag object with optional persistence."],
	["values(initial)", "Creates a subscribable runtime value object."],
	["useFlag(flags, key)", "Reads a single flag value from React."],
	["react-devtool/ui", "Exports Button, Input, Toggle, Group, Divider, Section, Tabs, CodeBlock, Inspector, and FeatureFlags."],
]

function copyText(value: string) {
	if (typeof navigator !== "undefined" && navigator.clipboard) {
		void navigator.clipboard.writeText(value)
	}
}

function CommandLine({ command }: { command: string }) {
	return (
		<div className="command-line">
			<code>{command}</code>
			<button type="button" onClick={() => copyText(command)}>
				Copy
			</button>
		</div>
	)
}

function HighlightedCode({
	code,
	language,
}: {
	code: string
	language: CodeLanguage
}) {
	const [html, setHtml] = useState<string | null>(null)

	useEffect(() => {
		let isCurrent = true
		setHtml(null)

		void highlightCode(code, language)
			.then((highlightedHtml) => {
				if (isCurrent) {
					setHtml(highlightedHtml)
				}
			})
			.catch(() => {
				if (isCurrent) {
					setHtml(null)
				}
			})

		return () => {
			isCurrent = false
		}
	}, [code, language])

	if (!html) {
		return (
			<pre className="highlighted-fallback">
				<code>{code}</code>
			</pre>
		)
	}

	return (
		<div
			className="highlighted-code"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}

function CodeExample({
	title,
	language = "tsx",
	children,
}: {
	title: string
	language?: CodeLanguage
	children: string
}) {
	return (
		<article className="docs-card">
			<div className="docs-card-header">
				<h3>{title}</h3>
				<button type="button" onClick={() => copyText(children)}>
					Copy
				</button>
			</div>
			<HighlightedCode code={children} language={language} />
		</article>
	)
}

function Header() {
	return (
		<header className="site-header">
			<a className="brand" href="#">
				<span className="brand-mark">rd</span>
				<span>React Devtool</span>
			</a>
			<nav>
				<a href="#install">Install</a>
				<a href="#agents">Agents</a>
				<a href="#api">API</a>
				<a
					href="https://github.com/ducan-ne/react-devtool"
					rel="noreferrer"
					target="_blank"
				>
					GitHub
				</a>
			</nav>
		</header>
	)
}

function Hero() {
	return (
		<section className="hero">
			<p className="kicker">React Devtool</p>
			<h1>A small in-page devtool for React apps.</h1>
			<p className="lede">
				Build your own internal debug panel with a floating toolbar, app-specific
				controls, feature flags, and runtime inspectors.
			</p>
			<ul className="feature-list">
				{features.map((feature) => (
					<li key={feature}>{feature}</li>
				))}
			</ul>
			<div className="hero-actions">
				<a className="button-primary" href="#install">
					Quick Start
				</a>
				<a className="button-secondary" href="#demo">
					Try Demo
				</a>
			</div>
			<CommandLine command={installCommand} />
		</section>
	)
}

function Demo({
	count,
	userId,
	showDebugLabels,
	verboseLogs,
	onIncrement,
	onUserIdChange,
	onFlagChange,
}: {
	count: number
	userId: string
	showDebugLabels: boolean
	verboseLogs: boolean
	onIncrement: () => void
	onUserIdChange: (value: string) => void
	onFlagChange: (key: FlagKey, value: boolean) => void
}) {
	return (
		<section className="page-section" id="demo">
			<h2>Try out a demo</h2>
			<p>
				Change the sample app below, then open the floating React Devtool
				toolbar to inspect the same state inside the panel.
			</p>

			<div className="demo-card">
				<div className="demo-preview">
					<div className="demo-toolbar">
						<span />
						<span />
						<span />
					</div>
					<div className="demo-body">
						<div>
							<p className="demo-label">Preview app</p>
							<h3>{userId}</h3>
							<p>
								Button clicked <strong>{count}</strong> time
								{count === 1 ? "" : "s"}.
							</p>
						</div>
						<button type="button" onClick={onIncrement}>
							Increment render count
						</button>
					</div>
				</div>

				<div className="demo-controls">
					<label htmlFor="demo-user">User id</label>
					<input
						id="demo-user"
						value={userId}
						onChange={(event) => onUserIdChange(event.currentTarget.value)}
					/>

					<button
						className="toggle-row"
						type="button"
						onClick={() => onFlagChange("showDebugLabels", !showDebugLabels)}
					>
						<span>Debug labels</span>
						<strong>{showDebugLabels ? "on" : "off"}</strong>
					</button>
					<button
						className="toggle-row"
						type="button"
						onClick={() => onFlagChange("verboseLogs", !verboseLogs)}
					>
						<span>Verbose logs</span>
						<strong>{verboseLogs ? "on" : "off"}</strong>
					</button>
				</div>
			</div>
		</section>
	)
}

function Docs() {
	return (
		<>
			<section className="page-section" id="install">
				<h2>Install</h2>
				<p>Install the package, then render the devtool once near your app root.</p>
				<CommandLine command={installCommand} />
				<CodeExample title="Quick Start">{quickStartCode}</CodeExample>
			</section>

			<section className="page-section">
				<h2>Manual examples</h2>
				<div className="docs-grid">
					<CodeExample title="Feature flags">{flagCode}</CodeExample>
					<CodeExample title="Custom UI">{uiCode}</CodeExample>
				</div>
			</section>

			<section className="page-section agent-section" id="agents">
				<p className="kicker">Agent workflows</p>
				<h2>Ship agent-built features behind runtime flags.</h2>
				<p>
					React Devtool makes feature flag work visible while you review, QA,
					dogfood, and gradually expose agent-generated changes. PRs still guard
					code quality; flags control who sees the new behavior.
				</p>
				<div className="agent-grid">
					<div className="agent-flow" aria-label="Agent feature flag workflow">
						{agentWorkflow.map(([number, title, description]) => (
							<article className="agent-step" key={title}>
								<span>{number}</span>
								<div>
									<h3>{title}</h3>
									<p>{description}</p>
								</div>
							</article>
						))}
					</div>
					<CodeExample title="Agent-safe rollout">{agentFlagCode}</CodeExample>
				</div>
			</section>

			<section className="page-section" id="api">
				<h2>API Reference</h2>
				<div className="api-table">
					{apiRows.map(([name, description]) => (
						<div className="api-row" key={name}>
							<code>{name}</code>
							<p>{description}</p>
						</div>
					))}
				</div>
			</section>

			<section className="page-section">
				<h2>Why React Devtool?</h2>
				<p>
					React Devtool is for product teams that need app-specific developer
					controls, not just a generic inspector. Put feature flags, mock user
					switchers, network payloads, and state snapshots next to the app while
					you build.
				</p>
				<p>
					Want the full package docs? Read the{" "}
					<a
						href="https://github.com/ducan-ne/react-devtool#readme"
						rel="noreferrer"
						target="_blank"
					>
						README on GitHub
					</a>
					.
				</p>
			</section>
		</>
	)
}

function DevtoolPanel({
	count,
	userId,
	showDebugLabels,
	verboseLogs,
	snapshot,
	onIncrement,
	onUserIdChange,
	onFlagChange,
}: {
	count: number
	userId: string
	showDebugLabels: boolean
	verboseLogs: boolean
	snapshot: Record<string, unknown>
	onIncrement: () => void
	onUserIdChange: (value: string) => void
	onFlagChange: (key: FlagKey, value: boolean) => void
}) {
	return (
		<div className="space-y-4 p-1">
			<Group
				title="Demo controls"
				description="Local state controls rendered inside the toolbar popup."
			>
				<Button onClick={onIncrement}>Increment count ({count})</Button>
				<Input
					label="User id"
					value={userId}
					onChange={(event) => onUserIdChange(event.currentTarget.value)}
				/>
				<Divider label="Flags" />
				<div className="flex items-center justify-between rounded border border-neutral-700 p-2">
					<span className="text-xs text-neutral-300">Debug labels</span>
					<Toggle
						checked={showDebugLabels}
						onChange={(checked) => onFlagChange("showDebugLabels", checked)}
					/>
				</div>
				<div className="flex items-center justify-between rounded border border-neutral-700 p-2">
					<span className="text-xs text-neutral-300">Verbose logs</span>
					<Toggle
						checked={verboseLogs}
						onChange={(checked) => onFlagChange("verboseLogs", checked)}
					/>
				</div>
			</Group>

			<Group title="Feature flags" description="Backed by the subscribable flags helper.">
				<FeatureFlags values={demoFlags} />
			</Group>

			<Tabs defaultValue="snapshot">
				<Tab label="Snapshot" value="snapshot">
					<Inspector data={snapshot} expandLevel={2} />
				</Tab>
				<Tab label="Install" value="install">
					<CodeBlock language="bash">{installCommand}</CodeBlock>
				</Tab>
				<Tab label="Code" value="code">
					<CodeBlock language="tsx">{quickStartCode}</CodeBlock>
				</Tab>
			</Tabs>
		</div>
	)
}

function ToolbarHint() {
	return (
		<svg
			className="toolbar-hint"
			viewBox="0 0 150 92"
			aria-hidden="true"
		>
			<title>Arrow pointing to React Devtool toolbar</title>
			<path
				d="M8 18C39 6 69 12 89 35C104 52 115 64 134 76"
				className="toolbar-hint-path"
			/>
			<path d="M121 79L139 79L133 62" className="toolbar-hint-head" />
		</svg>
	)
}

export function App() {
	const [count, setCount] = useState(0)
	const [userId, setUserId] = useState("user_123")
	const showDebugLabels = Boolean(useFlag(demoFlags, "showDebugLabels"))
	const verboseLogs = Boolean(useFlag(demoFlags, "verboseLogs"))

	const snapshot = useMemo(
		() => ({
			package: "react-devtool",
			site: "react-devtool.com",
			count,
			userId,
			flags: {
				showDebugLabels,
				verboseLogs,
			},
		}),
		[count, showDebugLabels, userId, verboseLogs],
	)

	const increment = () => {
		setCount((value) => value + 1)
		if (demoFlags.value.verboseLogs) {
			console.log("React Devtool demo count", count + 1)
		}
	}

	const changeFlag = (key: FlagKey, value: boolean) => {
		demoFlags.value = {
			...demoFlags.value,
			[key]: value,
		}
	}

	return (
		<main className="site-shell">
			<Header />
			<Hero />
			<Demo
				count={count}
				userId={userId}
				showDebugLabels={showDebugLabels}
				verboseLogs={verboseLogs}
				onIncrement={increment}
				onUserIdChange={setUserId}
				onFlagChange={changeFlag}
			/>
			<Docs />
			<footer className="site-footer">
				<span>Apache-2.0 licensed. Built for React app teams.</span>
				<a href="#">Back to top</a>
			</footer>
			<ToolbarHint />
			<Devtool toolbarPlacement="bottom-right">
				<DevtoolPanel
					count={count}
					userId={userId}
					showDebugLabels={showDebugLabels}
					verboseLogs={verboseLogs}
					snapshot={snapshot}
					onIncrement={increment}
					onUserIdChange={setUserId}
					onFlagChange={changeFlag}
				/>
			</Devtool>
		</main>
	)
}
