import { useSignalEffect } from "@preact/signals";
import { useCallback } from "preact/hooks";
import { ReactDevtoolInternals, Store } from "~core/index";
import { Icon } from "~web/components/icon";
import { Logo } from "~web/components/logo";
import { signalWidgetViews } from "~web/state";
import { constant } from "~web/utils/preact/constant";
import { FPSMeter } from "~web/widget/fps-meter";

if (import.meta.env.DEV) {
	setTimeout(() => {
		signalWidgetViews.value = {
			view: "notifications",
		};
	}, 300);
}

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

		if (!ReactDevtoolInternals.instrumentation) {
			return;
		}
		// todo: set a single source of truth
		const isPaused = !ReactDevtoolInternals.instrumentation.isPaused.value;
		ReactDevtoolInternals.instrumentation.isPaused.value = isPaused;
		const existingLocalStorageOptions =
			readLocalStorage<LocalStorageOptions>("react-devtool-options");
		saveLocalStorage("react-devtool-options", {
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
		<div className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden">
			<div className="h-full flex items-center min-w-fit">
				<button
					type="button"
					id="react-devtool-inspect-element"
					title="Inspect element"
					onClick={onToggleInspect}
					className="button flex items-center justify-center h-full w-full pl-3 pr-2.5"
					style={{ color: inspectColor }}
				>
					{inspectIcon}
				</button>
			</div>
			<button
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
				className="flex items-center min-w-fit w-6 h-4 mt-2.5"
				data-testid="open-devtool"
			>
				<Logo className="text-sm me-0 w-4 h-4 text-brand-dark flex origin-center transition-all ease-in-out" />
			</button>

			{/* <Toggle
				checked={!ReactDevtoolInternals.instrumentation?.isPaused.value}
				onChange={onToggleActive}
				className="place-self-center"
				title="Outline Re-renders"
			/> */}

			{/* todo add back showFPS*/}
			{ReactDevtoolInternals.options.value.showFPS && <FPSMeter />}
		</div>
	);
});
