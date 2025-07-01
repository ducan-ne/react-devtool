import { type ReactNode, forwardRef } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { cn } from "~web/utils/helpers";
import { signalWidgetViews } from "~web/state";
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
					<span className="font-medium text-white">React Devtool</span>
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
	{ id: "router", title: "Router" },
	{ id: "feature-flags", title: "Feature Flags" },
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

const TabsSidebar = ({
	tabs,
	selectedTab,
	onSelectTab,
}: {
	tabs: { id: string; title: string }[];
	selectedTab: string;
	onSelectTab: (id: string) => void;
}) => {
	return (
		<div className="flex flex-col h-full bg-[#1e1e1e] p-2 gap-1">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => onSelectTab(tab.id)}
					className={cn(
						"p-2 rounded text-left text-sm transition-colors w-full truncate",
						selectedTab === tab.id
							? "bg-brand-dark text-white"
							: "text-neutral-400 hover:bg-[#27272A] hover:text-white",
					)}
				>
					{tab.title}
				</button>
			))}
		</div>
	);
};

const TabContent = ({ selectedTab }: { selectedTab: string }) => {
	// This will render the content based on the selected tab.
	// The user's application content (<Devtool>'s children) will be one of these.
	const content = TABS.find((tab) => tab.id === selectedTab)?.title;

	return (
		<div className="p-4 text-white">
			<h2 className="text-xl font-bold mb-4">{content}</h2>
			<p>Content for the "{content}" tab goes here.</p>
			{selectedTab === "app" && (
				<div className="mt-4 p-4 border border-dashed border-neutral-600 rounded">
					<p className="text-neutral-400">
						This area will display the children passed to the `Devtool`
						component.
					</p>
				</div>
			)}
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
					<TabsSidebar
						tabs={TABS}
						selectedTab={selectedTab}
						onSelectTab={setSelectedTab}
					/>
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
