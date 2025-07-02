import { useEffect, useRef, useState } from "react"
import { setOptions } from "./devtool/core/index"
import { Inspector } from "react-inspector"
import { Devtool } from "./devtool"
import { FormExample } from "./form"
import { Button } from "./ui"

export function Timer({ onCallback }: { onCallback: () => void }) {
	const [seconds, setSeconds] = useState(0)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		console.log("Timer useEffect")
		intervalRef.current = setInterval(() => {
			setSeconds((prev) => prev + 1)
		}, 1000)
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	const handleReset = () => {
		setSeconds(0)
		onCallback()
	}

	return (
		<div>
			<div className={"text" + "-gray-800"}>
				Timer: {seconds} second{seconds !== 1 ? "s" : ""}
			</div>
			<button
				onClick={handleReset}
				style={{ marginTop: "4px", padding: "2px 8px" }}
			>
				Reset
			</button>
		</div>
	)
}

export function App() {
	return (
		<>
			<FormExample />2
			<Devtool>
				<div className="flex flex-col gap-2">
					Hello world
					<div className="react-devtool-toggle">
						<input type="checkbox" />
						<div />
					</div>
					<Timer
						onCallback={() => {
							console.log("callback reset")
						}}
					/>
					<hr />
					<Button>Click me</Button>
				</div>
			</Devtool>
		</>
	)
}
