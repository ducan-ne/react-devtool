import { type ReactNode, forwardRef } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { cn } from "~web/utils/helpers";
import { signalWidgetViews, userChildren } from "~web/state";
import { Logo } from "~web/components/logo";
import { Icon } from "~web/components/icon";
import { onCLS, onINP, onFCP, onLCP, onTTFB } from "web-vitals";
import { PropertiesView, } from "../inspector/properties";

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
	{ id: "layout-shifts", title: "Layout Shifts" },
	{ id: "open-graph", title: "Open Graph" },
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
			<div id={rightPanelId} className="flex-1 h-full overflow-y-scroll">
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

// Layout Shifts Hook
const useLayoutShifts = () => {
	const [vitals, setVitals] = useState({
		cls: 0,
		inp: 0,
		fcp: 0,
		lcp: 0,
		ttfb: 0,
	});
	const [shifts, setShifts] = useState<
		Array<{
			value: number;
			entries: Array<{
				name: string;
				startTime: number;
				value: number;
			}>;
			timestamp: number;
			id: string;
		}>
	>([]);

	useEffect(() => {
		onCLS((metric: any) => {
			setVitals((prev) => ({ ...prev, cls: metric.value }));
			setShifts((prev) => [
				...prev,
				{
					value: metric.value,
					entries: metric.entries.map((entry: any) => ({
						name: entry.name || "Unknown",
						startTime: entry.startTime,
						value: entry.value,
					})),
					timestamp: Date.now(),
					id: metric.id,
				},
			]);
		});

		onINP((metric: any) => {
			setVitals((prev) => ({ ...prev, inp: metric.value }));
		});

		onFCP((metric: any) => {
			setVitals((prev) => ({ ...prev, fcp: metric.value }));
		});

		onLCP((metric: any) => {
			setVitals((prev) => ({ ...prev, lcp: metric.value }));
		});

		onTTFB((metric: any) => {
			setVitals((prev) => ({ ...prev, ttfb: metric.value }));
		});
	}, []);

	return { vitals, shifts };
};

// Open Graph Hook
const useOpenGraph = () => {
	const [ogData, setOgData] = useState<Record<string, string>>({});
	const [twitterData, setTwitterData] = useState<Record<string, string>>({});

	useEffect(() => {
		const extractMetaTags = () => {
			const metaTags = document.querySelectorAll("meta");
			const og: Record<string, string> = {};
			const twitter: Record<string, string> = {};

			metaTags.forEach((tag) => {
				const property =
					tag.getAttribute("property") || tag.getAttribute("name");
				const content = tag.getAttribute("content");

				if (property && content) {
					if (property.startsWith("og:")) {
						og[property] = content;
					} else if (property.startsWith("twitter:")) {
						twitter[property] = content;
					}
				}
			});

			// Also get title and description from document
			og["title"] = og["og:title"] || document.title;
			og["description"] =
				og["og:description"] ||
				document
					.querySelector('meta[name="description"]')
					?.getAttribute("content") ||
				"";
			og["url"] = og["og:url"] || window.location.href;

			setOgData(og);
			setTwitterData(twitter);
		};

		extractMetaTags();

		// Re-extract if the page changes (for SPAs)
		const observer = new MutationObserver(extractMetaTags);
		observer.observe(document.head, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, []);

	return { ogData, twitterData };
};

const TabContent = ({ selectedTab }: { selectedTab: string }) => {
	const { vitals, shifts } = useLayoutShifts();
	const { ogData, twitterData } = useOpenGraph();

	const renderTabContent = () => {
		switch (selectedTab) {
			case "layout-shifts":
				return (
					<div
						className="h-full w-full p-4 text-white space-y-8"
						style={{ viewTransitionName: "tab-content" }}
					>
						<PropertiesView />
						<div className="space-y-6">
							<div className="flex items-center gap-3">
								<div className="w-1 h-6 bg-brand-dark rounded-full"></div>
								<h2 className="text-xl font-display font-semibold text-white">
									Core Web Vitals
								</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
								<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-yellow-400/30 transition-colors">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
										<span className="text-xs font-medium text-gray-300">
											CLS
										</span>
									</div>
									<div className="text-md font-mono font-bold text-yellow-400">
										{vitals.cls.toFixed(2)}
									</div>
								</div>

								<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-blue-400/30 transition-colors">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span className="text-xs font-medium text-gray-300">
											INP
										</span>
									</div>
									<div className="text-md font-mono font-bold text-blue-400">
										{vitals.inp.toFixed(0)}
										<span className="text-xs text-gray-400 ml-1">ms</span>
									</div>
								</div>

								<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-green-400/30 transition-colors">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="w-2 h-2 bg-green-400 rounded-full"></div>
										<span className="text-xs font-medium text-gray-300">
											FCP
										</span>
									</div>
									<div className="text-md font-mono font-bold text-green-400">
										{vitals.fcp.toFixed(0)}
										<span className="text-xs text-gray-400 ml-1">ms</span>
									</div>
								</div>

								<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-400/30 transition-colors">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
										<span className="text-xs font-medium text-gray-300">
											LCP
										</span>
									</div>
									<div className="text-md font-mono font-bold text-purple-400">
										{vitals.lcp.toFixed(0)}
										<span className="text-xs text-gray-400 ml-1">ms</span>
									</div>
								</div>

								<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-red-400/30 transition-colors">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="w-2 h-2 bg-red-400 rounded-full"></div>
										<span className="text-xs font-medium text-gray-300">
											TTFB
										</span>
									</div>
									<div className="text-md font-mono font-bold text-red-400">
										{vitals.ttfb.toFixed(0)}
										<span className="text-xs text-gray-400 ml-1">ms</span>
									</div>
								</div>
							</div>
						</div>

						{/* Layout Shift Events */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
								<h2 className="text-xl font-display font-semibold text-white">
									Layout Shift Events
								</h2>
								{shifts.length > 0 && (
									<span className="px-2 py-1 text-xs font-medium bg-yellow-400/10 text-yellow-400 rounded-full">
										{shifts.length} events
									</span>
								)}
							</div>

							{shifts.length === 0 ? (
								<div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/30 text-center">
									<div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
										<Icon
											name="icon-close"
											size={20}
											className="text-green-400"
										/>
									</div>
									<div className="text-gray-300 font-medium mb-1">
										No layout shifts detected
									</div>
									<div className="text-sm text-gray-400">
										Try interacting with the page to trigger measurements
									</div>
								</div>
							) : (
								<div className="space-y-3">
									{shifts.map((shift) => (
										<div
											key={shift.id}
											className="bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-yellow-400/30 transition-colors"
										>
											<div className="p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-2">
														<div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
														<span className="font-mono text-yellow-400 font-bold">
															{shift.value.toFixed(4)}
														</span>
														<span className="text-xs text-gray-400">
															shift value
														</span>
													</div>
													<span className="text-xs text-gray-400 font-mono">
														{new Date(shift.timestamp).toLocaleTimeString()}
													</span>
												</div>

												{shift.entries.length > 0 && (
													<div className="space-y-2">
														{shift.entries.map((entry, entryIndex) => (
															<div
																key={`${shift.id}-${entryIndex}`}
																className="flex items-center gap-2 text-sm"
															>
																<div className="w-1 h-1 bg-gray-400 rounded-full"></div>
																<span className="text-gray-300">
																	{entry.name}
																</span>
																<span className="text-gray-500">•</span>
																<span className="font-mono text-gray-400">
																	{entry.value.toFixed(4)}
																</span>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				);

			case "open-graph":
				return (
					<div
						className="h-full w-full p-6 text-white space-y-8"
						style={{ viewTransitionName: "tab-content" }}
					>
						{/* Link Preview */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="w-1 h-6 bg-brand-dark rounded-full"></div>
								<h2 className="text-xl font-display font-semibold text-white">
									Social Media Preview
								</h2>
							</div>

							<div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 max-w-md">
								<div className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
									Link Preview
								</div>

								{ogData["og:image"] && (
									<div className="mb-4 overflow-hidden rounded-lg">
										<img
											src={ogData["og:image"]}
											alt="Preview"
											className="w-full h-40 object-cover"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
									</div>
								)}

								<div className="space-y-2">
									<h3 className="font-semibold text-white line-clamp-2 leading-snug">
										{ogData["og:title"] || ogData.title || "No title"}
									</h3>
									<p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
										{ogData["og:description"] ||
											ogData.description ||
											"No description"}
									</p>
									<div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
										<div className="w-1 h-1 bg-gray-500 rounded-full"></div>
										<span className="truncate">
											{ogData["og:url"] || ogData.url || window.location.href}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Open Graph Properties */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="w-1 h-6 bg-blue-400 rounded-full"></div>
								<h2 className="text-xl font-display font-semibold text-white">
									Open Graph Properties
								</h2>
								{Object.entries(ogData).length > 0 && (
									<span className="px-2 py-1 text-xs font-medium bg-blue-400/10 text-blue-400 rounded-full">
										{Object.entries(ogData).length} properties
									</span>
								)}
							</div>

							{Object.entries(ogData).length === 0 ? (
								<div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/30 text-center">
									<div className="w-12 h-12 bg-orange-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
										<Icon
											name="icon-close"
											size={20}
											className="text-orange-400"
										/>
									</div>
									<div className="text-gray-300 font-medium mb-1">
										No Open Graph meta tags found
									</div>
									<div className="text-sm text-gray-400">
										Add og: meta tags to improve social media sharing
									</div>
								</div>
							) : (
								<div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
									<div className="p-4 space-y-3">
										{Object.entries(ogData).map(([key, value]) => (
											<div
												key={key}
												className="flex gap-4 py-2 border-b border-gray-700/30 last:border-b-0"
											>
												<div className="font-mono text-sm text-blue-400 min-w-32 flex-shrink-0">
													{key}
												</div>
												<div className="text-sm text-gray-300 break-all">
													{value}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Twitter Card Properties */}
						{Object.entries(twitterData).length > 0 && (
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-1 h-6 bg-green-400 rounded-full"></div>
									<h2 className="text-xl font-display font-semibold text-white">
										Twitter Card Properties
									</h2>
									<span className="px-2 py-1 text-xs font-medium bg-green-400/10 text-green-400 rounded-full">
										{Object.entries(twitterData).length} properties
									</span>
								</div>

								<div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
									<div className="p-4 space-y-3">
										{Object.entries(twitterData).map(([key, value]) => (
											<div
												key={key}
												className="flex gap-4 py-2 border-b border-gray-700/30 last:border-b-0"
											>
												<div className="font-mono text-sm text-green-400 min-w-32 flex-shrink-0">
													{key}
												</div>
												<div className="text-sm text-gray-300 break-all">
													{value}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				);

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
		<div className="w-full font-text pb-18">
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

const MainView = () => {
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
