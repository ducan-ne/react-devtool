import { signal, Signal } from "@preact/signals";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";

import { isEqual } from "~core/utils";
import { CopyToClipboard } from "~web/components/copy-to-clipboard";
import { Icon } from "~web/components/icon";
import { useMergedRefs } from "~web/hooks/use-merged-refs";
import { cn } from "~web/utils/helpers";
import { globalInspectorState } from ".";
import { flashManager } from "./flash-overlay";
import {
	detectValueType,
	formatForClipboard,
	formatInitialValue,
	formatValue,
	isEditableValue,
	isExpandable,
	isPromise,
	sanitizeString,
	updateNestedValue,
} from "./utils";

interface ValueMetadata {
	type: string;
	displayValue: string;
	value?: unknown;
	size?: number;
	length?: number;
	byteLength?: number;
	entries?: Record<string, ValueMetadata>;
	items?: Array<ValueMetadata>;
}
interface PropertyElementProps {
	name: string;
	value: unknown | ValueMetadata;
	level: number;
	parentPath?: string;
	allowEditing?: boolean;
	onSave: (path: string[], value: unknown) => void;
}

interface PropertySectionProps {
	refSticky?:
		| ReturnType<typeof useMergedRefs<HTMLElement>>
		| ((node: HTMLElement | null) => void);
	isSticky?: boolean;
	name: string;
	data: Signal<Record<string, unknown>>;
}

interface EditableValueProps {
	value: unknown;
	onSave: (newValue: unknown) => void;
	onCancel: () => void;
}

const EditableValue = ({
	value,
	onSave,
	onCancel,
}: EditableValueProps) => {
	const refInput = useRef<HTMLInputElement>(null);
	const [editValue, setEditValue] = useState("");

	useEffect(() => {
		let initialValue = "";
		try {
			if (value instanceof Date) {
				initialValue = value.toISOString().slice(0, 16);
			} else if (
				value instanceof Map ||
				value instanceof Set ||
				value instanceof RegExp ||
				value instanceof Error ||
				value instanceof ArrayBuffer ||
				ArrayBuffer.isView(value) ||
				(typeof value === "object" && value !== null)
			) {
				initialValue = formatValue(value);
			} else {
				initialValue = formatInitialValue(value);
			}
		} catch {
			initialValue = String(value);
		}
		const sanitizedValue = sanitizeString(initialValue);
		setEditValue(sanitizedValue);

		requestAnimationFrame(() => {
			if (!refInput.current) return;
			refInput.current.focus();
			if (typeof value === "string") {
				refInput.current.setSelectionRange(1, sanitizedValue.length - 1);
			} else {
				refInput.current.select();
			}
		});
	}, [value]);

	const handleChange = useCallback((e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target) {
			setEditValue(target.value);
		}
	}, []);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			try {
				let newValue: unknown;
				if (value instanceof Date) {
					const date = new Date(editValue);
					if (Number.isNaN(date.getTime())) {
						throw new Error("Invalid date");
					}
					newValue = date;
				} else {
					const detected = detectValueType(editValue);
					newValue = detected.value;
				}
				onSave(newValue);
			} catch {
				onCancel();
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			onCancel();
		}
	};

	return (
		<input
			ref={refInput}
			type={value instanceof Date ? "datetime-local" : "text"}
			className="react-devtool-input flex-1 font-text"
			value={editValue}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			onBlur={onCancel}
			step={value instanceof Date ? 1 : undefined}
		/>
	);
};

const PropertyElement = ({
	name,
	value,
	level,
	parentPath,
	allowEditing = true,
	onSave,
}: PropertyElementProps) => {
	const refElement = useRef<HTMLDivElement>(null);

	const currentPath = parentPath ? `${parentPath}.${name}` : name;
	const [isExpanded, setIsExpanded] = useState(
		globalInspectorState.expandedPaths.has(currentPath),
	);
	const [isEditing, setIsEditing] = useState(false);

	const prevValue = globalInspectorState.lastRendered.get(currentPath);
	const isChanged = !isEqual(prevValue, value);

	useEffect(() => {
		if (name === "children") {
			return;
		}

		const isFirstRender = !globalInspectorState.lastRendered.has(currentPath);
		const shouldFlash = isChanged && refElement.current && !isFirstRender;

		globalInspectorState.lastRendered.set(currentPath, value);

		if (shouldFlash && refElement.current && level === 0) {
			flashManager.create(refElement.current);
		}
	}, [value, isChanged, currentPath, level, name]);

	const handleToggleExpand = useCallback(() => {
		setIsExpanded((prevState: boolean) => {
			const newIsExpanded = !prevState;
			if (newIsExpanded) {
				globalInspectorState.expandedPaths.add(currentPath);
			} else {
				globalInspectorState.expandedPaths.delete(currentPath);
			}
			return newIsExpanded;
		});
	}, [currentPath]);

	const valuePreview = useMemo(() => {
		if (typeof value === "object" && value !== null) {
			if ("displayValue" in value) {
				return String(value.displayValue);
			}
		}
		return formatValue(value);
	}, [value]);

	const clipboardText = useMemo(() => {
		if (typeof value === "object" && value !== null) {
			if ("value" in value) {
				return String(formatForClipboard(value.value));
			}
			if ("displayValue" in value) {
				return String(value.displayValue);
			}
		}
		return String(formatForClipboard(value));
	}, [value]);

	const isExpandableValue = useMemo(() => {
		if (!value || typeof value !== "object") return false;

		if ("type" in value) {
			const metadata = value as ValueMetadata;
			switch (metadata.type) {
				case "array":
				case "Map":
				case "Set":
					return (metadata.size ?? metadata.length ?? 0) > 0;
				case "object":
					return (metadata.size ?? 0) > 0;
				case "ArrayBuffer":
				case "DataView":
					return (metadata.byteLength ?? 0) > 0;
				case "circular":
				case "promise":
				case "function":
				case "error":
					return false;
				default:
					if ("entries" in metadata || "items" in metadata) {
						return true;
					}
					return false;
			}
		}

		return isExpandable(value);
	}, [value]);

	const canEdit = useMemo(() => {
		if (!allowEditing) return false;
		return true;
	}, [allowEditing]);

	const handleEdit = useCallback(() => {
		if (canEdit) {
			setIsEditing(true);
		}
	}, [canEdit]);

	const handleSave = (newValue: unknown) => {
		const path = currentPath.split(".");
		onSave(path, newValue);
		setIsEditing(false);
	};

	const checkCircularInValue = useMemo((): boolean => {
		if (!value || typeof value !== "object" || isPromise(value)) return false;

		return "type" in value && value.type === "circular";
	}, [value]);

	const renderNestedProperties = useCallback(
		(obj: unknown): preact.ComponentChildren => {
			if (!obj || typeof obj !== "object") return null;

			if ("type" in obj) {
				const metadata = obj as ValueMetadata;
				if ("entries" in metadata && metadata.entries) {
					const entries = Object.entries(metadata.entries);
					if (entries.length === 0) return null;

					return (
						<div className="react-devtool-nested">
							{entries.map(([key, val]) => (
								<PropertyElement
									key={`${currentPath}-entry-${key}`}
									name={key}
									value={val}
									level={level + 1}
									parentPath={currentPath}
									allowEditing={allowEditing}
									onSave={onSave}
								/>
							))}
						</div>
					);
				}

				if ("items" in metadata && Array.isArray(metadata.items)) {
					if (metadata.items.length === 0) return null;
					return (
						<div className="react-devtool-nested">
							{metadata.items.map((item, i) => {
								const itemKey = `${currentPath}-item-${item.type}-${i}`;
								return (
									<PropertyElement
										key={itemKey}
										name={`${i}`}
										value={item}
										level={level + 1}
										parentPath={currentPath}
										allowEditing={allowEditing}
										onSave={onSave}
									/>
								);
							})}
						</div>
					);
				}
				return null;
			}

			let entries: Array<[key: string | number, value: unknown]>;

			if (obj instanceof ArrayBuffer) {
				const view = new Uint8Array(obj);
				entries = Array.from(view).map((v, i) => [i, v]);
			} else if (obj instanceof DataView) {
				const view = new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength);
				entries = Array.from(view).map((v, i) => [i, v]);
			} else if (ArrayBuffer.isView(obj)) {
				if (obj instanceof BigInt64Array || obj instanceof BigUint64Array) {
					entries = Array.from({ length: obj.length }, (_, i) => [i, obj[i]]);
				} else {
					const typedArray = obj as unknown as ArrayLike<number>;
					entries = Array.from(typedArray).map((v, i) => [i, v]);
				}
			} else if (obj instanceof Map) {
				entries = Array.from(obj.entries()).map(([k, v]) => [String(k), v]);
			} else if (obj instanceof Set) {
				entries = Array.from(obj).map((v, i) => [i, v]);
			} else if (Array.isArray(obj)) {
				entries = obj.map((value, index) => [`${index}`, value]);
			} else {
				entries = Object.entries(obj);
			}

			if (entries.length === 0) return null;

			const canEditChildren = !(
				obj instanceof DataView ||
				obj instanceof ArrayBuffer ||
				ArrayBuffer.isView(obj)
			);

			return (
				<div className="react-devtool-nested">
					{entries.map(([key, val]) => {
						const itemKey = `${currentPath}-${typeof key === "number" ? `item-${key}` : key}`;
						return (
							<PropertyElement
								key={itemKey}
								name={String(key)}
								value={val}
								level={level + 1}
								parentPath={currentPath}
								allowEditing={canEditChildren}
								onSave={onSave}
							/>
						);
					})}
				</div>
			);
		},
		[level, currentPath, allowEditing, onSave],
	);

	if (checkCircularInValue) {
		return (
			<div className="react-devtool-property">
				<div className="react-devtool-property-content">
					<div className="react-devtool-preview-line">
						<div className="react-devtool-key">{name}:</div>
						<span className="text-yellow-500">[Circular Reference]</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div ref={refElement} className="react-devtool-property">
			<div className="react-devtool-property-content">
				{isExpandableValue && (
					<button
						type="button"
						onClick={handleToggleExpand}
						className="react-devtool-arrow"
					>
						<Icon
							name="icon-chevron-right"
							size={12}
							className={cn(isExpanded && "rotate-90")}
						/>
					</button>
				)}

				<div
					className={cn(
						"group",
						"react-devtool-preview-line",
						isChanged && "react-devtool-highlight",
					)}
				>
					<div className="react-devtool-key !text-white z-[99999] font-display">
						{name}:
					</div>
					{isEditing && isEditableValue(value, parentPath) ? (
						<EditableValue
							value={value}
							onSave={handleSave}
							onCancel={() => setIsEditing(false)}
						/>
					) : typeof value === "boolean" && canEdit ? (
						<div className="react-devtool-toggle">
							<input
								type="checkbox"
								checked={value}
								onChange={(e) => handleSave(e.currentTarget.checked)}
							/>
							<div />
						</div>
					) : (
						<button type="button" className="truncate" onClick={handleEdit}>
							{valuePreview}
						</button>
					)}
					<CopyToClipboard
						text={clipboardText}
						className="opacity-0 transition-opacity group-hover:opacity-100"
					>
						{({ ClipboardIcon }) => <>{ClipboardIcon}</>}
					</CopyToClipboard>
				</div>
				<div
					className={cn(
						"react-devtool-expandable",
						isExpanded && "react-devtool-expanded",
					)}
				>
					{isExpandableValue && isExpanded && (
						<div className="react-devtool-nested">
							{renderNestedProperties(value)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const PropertySection = ({
	refSticky,
	isSticky,
	name,
	data,
}: PropertySectionProps) => {
	const refStickyElement = useRef<HTMLElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(true);

	const refs = useMergedRefs(refStickyElement, refSticky);

	const currentData = data.value;

	const handleSave = useCallback(
		(path: string[], value: unknown) => {
			const newData = updateNestedValue(data.value, path, value);
			if (typeof newData === "object" && newData !== null) {
				data.value = { ...(newData as object) };
			}
		},
		[data],
	);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((state) => {
			if (isSticky && isExpanded) {
				return state;
			}
			return !state;
		});
	}, [isExpanded, isSticky]);

	console.log(currentData);
	if (
		!currentData ||
		(Array.isArray(currentData)
			? currentData.length === 0
			: Object.keys(currentData).length === 0)
	) {
		return null;
	}

	const propertyCount = Array.isArray(currentData)
		? currentData.length
		: Object.keys(currentData).length;

	return (
		<>
			<button
				ref={refs}
				type="button"
				onClick={toggleExpanded}
				data-sticky
				className="react-section-header"
			>
				<div className="w-4 h-4 flex items-center justify-center">
					<Icon
						name="icon-chevron-right"
						size={12}
						className={cn(
							isExpanded && "rotate-90",
							isSticky && isExpanded && "rotate-0",
						)}
					/>
				</div>
				<span className="capitalize">
					{name} {!isExpanded && propertyCount > 0 && `(${propertyCount})`}
				</span>
			</button>
			<div className="react-devtool-section">
				<div
					className={cn(
						"react-devtool-expandable",
						isExpanded && "react-devtool-expanded",
					)}
				>
					<div className="overflow-hidden">
						{Array.isArray(currentData)
							? currentData.map(({ name, value }) => (
									<PropertyElement
										key={name}
										name={name}
										value={value}
										level={0}
										onSave={handleSave}
									/>
								))
							: Object.entries(currentData).map(([key, value]) => (
									<PropertyElement
										key={key}
										name={key}
										value={value}
										level={0}
										onSave={handleSave}
									/>
								))}
					</div>
				</div>
			</div>
		</>
	);
};

// Example of how to use it with a mock signal
export const PropertiesView = () => {
	const mockSignal = useMemo(
		() =>
			signal({
				props: {
					className: "button primary",
					onClick: () => {},
					disabled: false,
					children: "Click me",
					style: {
						backgroundColor: "#007bff",
						padding: "10px 20px",
					},
				},
				state: {
					isLoading: false,
					count: 42,
					items: ["item1", "item2", "item3"],
					formData: {
						username: "testUser",
						email: "test@example.com",
					},
				},
				context: {
					theme: "dark",
					user: {
						id: 1,
						name: "John Doe",
						role: "admin",
					},
					settings: {
						notifications: true,
						language: "en",
					},
				},
			}),
		[],
	);

	const propsData = useMemo(() => signal(mockSignal.value.props), [mockSignal]);

	const stateData = useMemo(() => signal(mockSignal.value.state), [mockSignal]);

	const contextData = useMemo(
		() => signal(mockSignal.value.context),
		[mockSignal],
	);

	useEffect(() => {
		mockSignal.subscribe((value) => {
			propsData.value = value.props;
			stateData.value = value.state;
			contextData.value = value.context;
		});
	}, [mockSignal, propsData, stateData, contextData]);

	return (
		<div className="react-devtool-properties">
			<PropertySection name="Flags" data={propsData} />
			<PropertySection name="State" data={stateData} />
			<PropertySection name="Context" data={contextData} />
		</div>
	);
};
