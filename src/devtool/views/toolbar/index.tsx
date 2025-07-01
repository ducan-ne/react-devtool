import { useSignalEffect } from "@preact/signals";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "preact/hooks";
import { ReactScanInternals, Store } from "~core/index";
import { Icon } from "~web/components/icon";
import { signalWidgetViews } from "~web/state";
import { constant } from "~web/utils/preact/constant";
import { FPSMeter } from "~web/widget/fps-meter";

export const Toolbar = constant(() => {
	const inspectState = Store.inspectState;
	const isInspectActive = inspectState.value.kind === "inspecting";
	const isInspectFocused = inspectState.value.kind === "focused";

	const onToggleInspect = useCallback(() => {
		const currentState = Store.inspectState.value;

		switch (currentState.kind) {
			case "inspecting": {
				signalWidgetViews.value = {
					view: "none",
				};
				Store.inspectState.value = {
					kind: "inspect-off",
				};
				return;
			}

			case "focused": {
				signalWidgetViews.value = {
					view: "inspector",
				};
				Store.inspectState.value = {
					kind: "inspecting",
					hoveredDomElement: null,
				};
				return;
			}
			// todo: auto select the root fibers first stateNode, and tell the user to select the element
			case "inspect-off": {
				signalWidgetViews.value = {
					view: "none",
				};
				Store.inspectState.value = {
					kind: "inspecting",
					hoveredDomElement: null,
				};
				return;
			}
			case "uninitialized": {
				return;
			}
		}
	}, []);

	/* const onToggleActive = useCallback((e: Event) => {
		e.preventDefault();
		e.stopPropagation();

		if (!ReactScanInternals.instrumentation) {
			return;
		}
		// todo: set a single source of truth
		const isPaused = !ReactScanInternals.instrumentation.isPaused.value;
		ReactScanInternals.instrumentation.isPaused.value = isPaused;
		const existingLocalStorageOptions =
			readLocalStorage<LocalStorageOptions>("react-scan-options");
		saveLocalStorage("react-scan-options", {
			...existingLocalStorageOptions,
			enabled: !isPaused,
		});
	}, []); */

	useSignalEffect(() => {
		const state = Store.inspectState.value;
		if (state.kind === "uninitialized") {
			Store.inspectState.value = {
				kind: "inspect-off",
			};
		}
	});

	let inspectIcon = null;
	let inspectColor = "#999";

	if (isInspectActive) {
		inspectIcon = <Icon name="icon-inspect" />;
		inspectColor = "#8e61e3";
	} else if (isInspectFocused) {
		inspectIcon = <Icon name="icon-focus" />;
		inspectColor = "#8e61e3";
	} else {
		inspectIcon = <Icon name="icon-inspect" />;
		inspectColor = "#999";
	}
	return (
		<button
			type="button"
			className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden"
			onClick={() => {
				if (Store.inspectState.value.kind !== "inspect-off") {
					Store.inspectState.value = {
						kind: "inspect-off",
					};
				}
				switch (signalWidgetViews.value.view) {
					case "none": {
						signalWidgetViews.value = {
							view: "notifications",
						};
						return;
					}
				}
			}}
		>
			<div className="h-full flex items-center min-w-fit">
				<button
					type="button"
					id="react-scan-inspect-element"
					title="Inspect element"
					onClick={onToggleInspect}
					className="button flex items-center justify-center h-full w-full pl-3 pr-2.5"
					style={{ color: inspectColor }}
				>
					{inspectIcon}
				</button>
				Devtool
			</div>

			{/* <Toggle
				checked={!ReactScanInternals.instrumentation?.isPaused.value}
				onChange={onToggleActive}
				className="place-self-center"
				title="Outline Re-renders"
			/> */}

			{/* todo add back showFPS*/}
			{ReactScanInternals.options.value.showFPS && <FPSMeter />}
		</button>
	);
});
