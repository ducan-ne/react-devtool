import { type ReactNode, forwardRef } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { cn } from "~web/utils/helpers";
import { signalWidgetViews, userChildren } from "~web/state";
import { Logo } from "~web/components/logo";
import { Icon } from "~web/components/icon";

const MainViewHeader = () => {
	return (
		<div className={cn(["w-full flex border-b border-[#27272A] min-h-[48px]"])}>
			<div
				className={cn([
					"min-w-fit w-full justify-start flex items-center pl-5 pr-2 text-sm gap-x-4",
				])}
			>
				<div className="flex items-center gap-x-2">
					<Logo className="text-sm me-0 w-4 h-4 text-brand-dark flex origin-center transition-all ease-in-out" />
					<span className="font-medium font-display text-white">
						React Devtool
					</span>
				</div>
				<div className={cn(["flex items-center gap-x-2 justify-end ml-auto"])}>
					<div
						className={cn([
							"p-2 flex justify-center items-center border-[#27272A]",
						])}
					>
						<button
							type="button"
							onClick={() => {
								signalWidgetViews.value = {
									view: "none",
								};
							}}
							title="Close"
						>
							<Icon name="icon-close" size={18} className="text-[#6F6F78]" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// Mock data for tabs, this will be replaced with plugins and children
const TABS = [
	{ id: "app", title: "App" },
	// { id: "router", title: "Router" },
	// { id: "feature-flags", title: "Feature Flags" },
];

const ResizablePanel = ({
	leftPanel,
	rightPanel,
	showLeftPanel,
}: {
	leftPanel: ReactNode;
	rightPanel: ReactNode;
	showLeftPanel: boolean;
}) => {
	const refSidebar = useRef<HTMLDivElement>(null);
	const refIsResizing = useRef(false);
	const [sidebarWidth, setSidebarWidth] = useState(150);

	const handleResize = useCallback((e: PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!refSidebar.current) return;

		refIsResizing.current = true;
		refSidebar.current.style.pointerEvents = "none";
		document.body.style.cursor = "col-resize";

		const startWidth = refSidebar.current.offsetWidth;
		const startX = e.clientX;
		const maxSidebarWidth = window.innerWidth * 0.8; // 80% of window width

		const handlePointerMove = (e: PointerEvent) => {
			if (!refIsResizing.current) return;
			const newWidth = startWidth + e.clientX - startX;
			if (newWidth > 150 && newWidth < maxSidebarWidth) {
				setSidebarWidth(newWidth);
			}
		};

		const handlePointerUp = () => {
			refIsResizing.current = false;
			if (refSidebar.current) {
				refSidebar.current.style.pointerEvents = "auto";
			}
			document.body.style.cursor = "auto";
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
		};

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
	}, []);

	const rightPanelId = "main-content-panel";

	return (
		<div className="flex h-full w-full">
			{showLeftPanel && (
				<>
					<div
						ref={refSidebar}
						className="h-full"
						style={{ width: `${sidebarWidth}px` }}
					>
						{leftPanel}
					</div>
					<button
						type="button"
						onPointerDown={handleResize}
						aria-label="Resize sidebar"
						className="group w-2 !cursor-col-resize flex items-center justify-center bg-transparent"
					>
						<div className="w-[3px] h-8 bg-neutral-700 rounded-full group-hover:bg-brand-dark transition-colors" />
					</button>
				</>
			)}
			<div id={rightPanelId} className="flex-1 h-full overflow-auto">
				{rightPanel}
			</div>
		</div>
	);
};

const ReactContentRenderer = () => {
	const refContainer = useRef<HTMLDivElement>(null);
	// biome-ignore lint/suspicious/noExplicitAny: Root will be dynamically imported
	const refRoot = useRef<any | null>(null);

	useEffect(() => {
		const container = refContainer.current;
		if (!container) return;

		let unmounted = false;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let createRootPromise: Promise<any> | null = null;

		const renderReactContent = (children: React.ReactNode) => {
			if (!children) {
				if (refRoot.current) {
					refRoot.current.unmount();
					refRoot.current = null;
				}
				return;
			}

			if (!createRootPromise) {
				createRootPromise = import("react-dom/client").catch((err) => {
					console.error(
						"react-devtool: Failed to import 'react-dom/client'. If you are passing React children to <Devtool>, please ensure 'react-dom' is installed.",
						err,
					);
					if (container && !unmounted) {
						container.innerHTML = `<div style="color: #f87171; padding: 1rem; font-family: sans-serif;"><strong>Devtool Error</strong><br/>Could not render content because <code>react-dom</code> is not installed.</div>`;
					}
					return null;
				});
			}

			createRootPromise.then((ReactDOMClient) => {
				if (unmounted || !ReactDOMClient) return;

				if (!refRoot.current) {
					refRoot.current = ReactDOMClient.createRoot(container);
				}
				refRoot.current.render(children);
			});
		};

		const unsubscribe = userChildren.subscribe(renderReactContent);

		// Initial render
		if (userChildren.value) {
			renderReactContent(userChildren.value);
		}

		return () => {
			unmounted = true;
			unsubscribe();
			if (refRoot.current) {
				refRoot.current.unmount();
				refRoot.current = null;
			}
		};
	}, []);

	return <div ref={refContainer} className="h-full w-full" />;
};

const TabSidebar = ({
	selectedTab,
	onSelectTab,
}: {
	selectedTab: string;
	onSelectTab: (tabId: string) => void;
}) => {
	const handleTabClick = (tabId: string) => {
		document.startViewTransition(() => {
			onSelectTab(tabId);
		});
	};

	return (
		<div className="flex flex-col h-full bg-[#1e1e1e] p-2 gap-1 font-text">
			{TABS.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => handleTabClick(tab.id)}
					className={cn(
						"p-2 rounded text-left text-sm transition-colors w-full truncate",
						selectedTab === tab.id
							? "bg-brand-dark text-white"
							: "text-gray-300 hover:bg-gray-700 hover:text-white",
					)}
				>
					{tab.title}
				</button>
			))}
		</div>
	);
};

const TabContent = ({ selectedTab }: { selectedTab: string }) => {
	const renderTabContent = () => {
		switch (selectedTab) {
			case "router":
				return (
					<div
						className="h-full w-full p-4 text-white"
						style={{ viewTransitionName: "tab-content" }}
					>
						<div className="p-4 border border-gray-600 rounded">
							<h3 className="text-lg font-semibold mb-2">Router</h3>
							<p className="text-gray-300">
								Router configuration and debugging tools will be available here.
							</p>
						</div>
					</div>
				);
			case "feature-flags":
				return (
					<div
						className="h-full w-full p-4 text-white"
						style={{ viewTransitionName: "tab-content" }}
					>
						<div className="p-4 border border-gray-600 rounded">
							<h3 className="text-lg font-semibold mb-2">Feature Flags</h3>
							<p className="text-gray-300">
								Feature flag management and testing tools will be available
								here.
							</p>
						</div>
					</div>
				);
			default:
				return (
					<div
						className="h-full w-full p-4 text-white flex items-center justify-center"
						style={{ viewTransitionName: "tab-content" }}
					>
						<div className="text-gray-400">Select a tab to view content</div>
					</div>
				);
		}
	};

	return (
		<div className="h-full w-full font-text overflow-auto">
			{/* Always render ReactContentRenderer but conditionally show it */}
			<div
				className={cn(
					"h-full w-full p-4 text-white",
					selectedTab === "app" ? "block" : "hidden",
				)}
				style={{
					viewTransitionName: selectedTab === "app" ? "tab-content" : undefined,
				}}
			>
				<ReactContentRenderer />
			</div>

			{/* Render other tab content only when not showing app */}
			{selectedTab !== "app" && renderTabContent()}
		</div>
	);
};

export const MainView = () => {
	const [selectedTab, setSelectedTab] = useState(TABS[0].id);
	const showTabs = TABS.length > 1;

	return (
		<div className="flex flex-col h-full w-full">
			<MainViewHeader />
			<ResizablePanel
				showLeftPanel={showTabs}
				leftPanel={
					<TabSidebar selectedTab={selectedTab} onSelectTab={setSelectedTab} />
				}
				rightPanel={<TabContent selectedTab={selectedTab} />}
			/>
		</div>
	);
};

export const MainViewWrapper = forwardRef<HTMLDivElement>((_, ref) => {
	return (
		<div ref={ref} className="h-full w-full bg-black">
			<MainView />
		</div>
	);
});
