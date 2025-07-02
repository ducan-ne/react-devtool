import { useEffect, useRef, useState } from "react";
import { setOptions } from "./devtool/core/index";
import { Inspector } from "react-inspector";
import { Devtool } from "./devtool";

setOptions({
	showFPS: false,
	// showToolbar: true,
});

const theme: any = {
	BASE_FONT_FAMILY: "SFMono-Regular, 'SF Mono', Menlo, monospace",
	BASE_FONT_SIZE: "12px",
	BASE_LINE_HEIGHT: 1.2,

	BASE_BACKGROUND_COLOR: "none",
	BASE_COLOR: "var(--color-wash)",

	OBJECT_PREVIEW_ARRAY_MAX_PROPERTIES: 10,
	OBJECT_PREVIEW_OBJECT_MAX_PROPERTIES: 5,
	OBJECT_NAME_COLOR: "var(--color-yellow-30)",
	OBJECT_VALUE_NULL_COLOR: "var(--color-gray-40)",
	OBJECT_VALUE_UNDEFINED_COLOR: "var(--color-gray-40)",
	OBJECT_VALUE_REGEXP_COLOR: "var(--color-red-30)",
	OBJECT_VALUE_STRING_COLOR: "var(--color-blue-30)",
	OBJECT_VALUE_SYMBOL_COLOR: "var(--color-yellow-30)",
	OBJECT_VALUE_NUMBER_COLOR: "var(--color-yellow-30)",
	OBJECT_VALUE_BOOLEAN_COLOR: "var(--color-yellow-30)",
	OBJECT_VALUE_FUNCTION_PREFIX_COLOR: "var(--color-yellow-30)",

	HTML_TAG_COLOR: "var(--color-yellow-30)",
	HTML_TAGNAME_COLOR: "var(--color-yellow-30)",
	HTML_TAGNAME_TEXT_TRANSFORM: "lowercase",
	HTML_ATTRIBUTE_NAME_COLOR: "var(--color-gray-40)",
	HTML_ATTRIBUTE_VALUE_COLOR: "var(--color-blue-30)",
	HTML_COMMENT_COLOR: "var(--color-gray-40)",
	HTML_DOCTYPE_COLOR: "var(--color-gray-40)",

	ARROW_COLOR: "var(--color-gray-40)",
	ARROW_MARGIN_RIGHT: 3,
	ARROW_FONT_SIZE: 12,
	ARROW_ANIMATION_DURATION: "0",

	TREENODE_FONT_FAMILY: "Menlo, monospace",
	TREENODE_FONT_SIZE: "11px",
	TREENODE_LINE_HEIGHT: 1.2,
	TREENODE_PADDING_LEFT: 12,

	TABLE_BORDER_COLOR: "var(--color-gray-80)",
	TABLE_TH_BACKGROUND_COLOR: "var(--color-gray-95)",
	TABLE_TH_HOVER_COLOR: "var(--color-gray-90)",
	TABLE_SORT_ICON_COLOR: "var(--color-gray-40)",
	TABLE_DATA_BACKGROUND_IMAGE: "none",
	TABLE_DATA_BACKGROUND_SIZE: "0",
};

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
					<div className="react-devtool-toggle">
						<input type="checkbox" />
						<div />
					</div>
					<Timer
						onCallback={() => {
							console.log("callback reset");
						}}
					/>
					<hr />
					<Inspector
						theme={theme}
						data={[
							{
								_id: "56dcf573b09c217d39fd7621",
								name: "Howard Christensen",
								email: "howardchristensen@isotronic.com",
								phone: "+1 (830) 529-3176",
								address: "511 Royce Street, Hilltop, Tennessee, 9712",
							},
							{
								_id: "56dcf57323630b06251e93cd",
								name: "Eleanor Lynn",
								email: "eleanorlynn@isotronic.com",
								phone: "+1 (911) 576-2345",
								address: "547 Dearborn Court, Trona, California, 8629",
							},
							{
								_id: "56dcf5738279cac6b081e512",
								name: "Baxter Mooney",
								email: "baxtermooney@isotronic.com",
								phone: "+1 (954) 456-3456",
								address: "349 Cumberland Walk, Washington, Alaska, 3154",
							},
							{
								_id: "56dcf57303accabd43740957",
								name: "Calhoun Tyson",
								email: "calhountyson@isotronic.com",
								phone: "+1 (818) 456-2529",
								address: "367 Lyme Avenue, Ladera, Louisiana, 6292",
							},
							{
								_id: "56dcf57391ea6a9d1f60df0c",
								name: "Judith Jimenez",
								email: "judithjimenez@isotronic.com",
								phone: "+1 (950) 587-3415",
								address: "269 Bogart Street, Sultana, Vermont, 7833",
							},
							{
								_id: "56dcf5735a7a0718a61f294d",
								name: "Newman Lawson",
								email: "newmanlawson@isotronic.com",
								phone: "+1 (814) 484-2827",
								address: "969 Conduit Boulevard, Lowell, Oregon, 4118",
							},
						]}
						expandLevel={1}
						table={false}
					/>
				</div>
			</Devtool>
		</>
	);
}
