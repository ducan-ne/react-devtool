import { useEffect, useRef, useState } from "react";
import { setOptions } from "~core/index";
import { Devtool } from "./devtool";

setOptions({
	showFPS: false,
	// showToolbar: true,
});

export function Timer({ onCallback }: { onCallback: () => void }) {
	const [seconds, setSeconds] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		console.log("Timer useEffect");
		intervalRef.current = setInterval(() => {
			setSeconds((prev) => prev + 1);
		}, 1000);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	const handleReset = () => {
		setSeconds(0);
		onCallback();
	};

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
	);
}

export function App() {
	return (
		<>
			123
			<Devtool>
				<div className="flex flex-col gap-2">
					Hello world
					<div className="react-scan-toggle">
						<input type="checkbox" />
						<div />
					</div>
					<Timer
						onCallback={() => {
							console.log("callback reset");
						}}
					/>
				</div>
			</Devtool>
		</>
	);
}
