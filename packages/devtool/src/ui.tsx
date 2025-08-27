"use client"
import { cn } from "./utils/helpers"
import type { Signal } from "@preact/signals"
import {
	type ComponentProps,
	type ReactNode,
	useState,
	useId,
	forwardRef,
	useEffect,
	useRef,
} from "react"
import { Inspector as ReactInspector } from "react-inspector"
import { createPropertyRenderer } from "./views/inspector/properties"

export type Subscribable<T> = Signal<T> & {
	subscribe: (fn: (value: T) => void) => () => void
}

type FeatureFlagsProps = {
	name?: string
	values: Subscribable<Record<string, boolean>>
	onChange?: (key: string, value: boolean) => void
}

function Properties({
	name,
	data,
	refSticky,
	isSticky,
}: {
	name: string
	data: Subscribable<Record<string, unknown>>
	refSticky?: React.RefObject<HTMLElement>
	isSticky?: boolean
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const rendererRef = useRef(createPropertyRenderer())

	useEffect(() => {
		if (containerRef.current) {
			rendererRef.current.renderToDOM(containerRef.current, {
				name,
				data,
				refSticky: refSticky?.current ? () => refSticky.current : undefined,
				isSticky,
			})
		}

		return () => {
			if (containerRef.current) {
				rendererRef.current.unmount(containerRef.current)
			}
		}
	}, [name, data, refSticky, isSticky])

	// Re-render when data changes
	useEffect(() => {
		const unsubscribe = data.subscribe(() => {
			if (containerRef.current) {
				rendererRef.current.renderToDOM(containerRef.current, {
					name,
					data,
					refSticky: refSticky?.current ? () => refSticky.current : undefined,
					isSticky,
				})
			}
		})

		return unsubscribe
	}, [name, data, refSticky, isSticky])

	return <div ref={containerRef} />
}

export function FeatureFlags({ name = "Flags", values }: FeatureFlagsProps) {
	return (
		<div className="react-devtool-properties">
			<Properties name={name} data={values} />
		</div>
	)
}

// biome-ignore lint/suspicious/noExplicitAny: react-inspector types are not typed
const inspectorTheme: any = {
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
}

type InspectorProps = {
	data: any
	theme?: any
	expandLevel?: number
	table?: boolean
	className?: string
}

export function Inspector({
	data,
	theme = inspectorTheme,
	expandLevel = 1,
	table = false,
	className,
}: InspectorProps) {
	return (
		<div className={cn("text-xs font-mono", className)}>
			<ReactInspector
				data={data}
				theme={theme}
				expandLevel={expandLevel}
				table={table}
			/>
		</div>
	)
}

// -- a simple ui component library for users --

export function Button({
	className,
	children,
	variant = "default",
	size = "default",
	...props
}: ComponentProps<"button"> & {
	variant?: "default" | "outline" | "ghost" | "destructive"
	size?: "default" | "sm" | "lg"
}) {
	return (
		<button
			className={cn([
				"inline-flex items-center justify-center gap-x-1 rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50",
				{
					// Sizes
					"h-8 px-3 py-2 text-xs": size === "default",
					"h-7 px-2 py-1 text-xs": size === "sm",
					"h-9 px-4 py-2 text-sm": size === "lg",

					// Variants
					"bg-[#18181B] text-white hover:bg-[#34343b]": variant === "default",
					"border border-neutral-600 bg-transparent text-neutral-300 hover:bg-neutral-800":
						variant === "outline",
					"text-neutral-300 hover:bg-neutral-800": variant === "ghost",
					"bg-red-600 text-white hover:bg-red-700": variant === "destructive",
				},
				className,
			])}
			{...props}
		>
			{children}
		</button>
	)
}

type ToggleProps = {
	checked?: boolean
	onChange?: (checked: boolean) => void
	disabled?: boolean
	className?: string
	id?: string
}

export function Toggle({
	checked = false,
	onChange,
	disabled = false,
	className,
	id,
}: ToggleProps) {
	return (
		<button
			id={id}
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange?.(!checked)}
			className={cn([
				"relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
				checked ? "bg-blue-600" : "bg-neutral-600",
				className,
			])}
		>
			<span
				className={cn([
					"pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform",
					checked ? "translate-x-3" : "translate-x-0",
				])}
			/>
		</button>
	)
}

type InputProps = ComponentProps<"input"> & {
	label?: string
	error?: string
	helpText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, error, helpText, id: providedId, ...props }, ref) => {
		const generatedId = useId()
		const id = providedId || generatedId

		return (
			<div className="space-y-1">
				{label && (
					<label htmlFor={id} className="text-xs font-medium text-neutral-300">
						{label}
					</label>
				)}
				<input
					id={id}
					ref={ref}
					className={cn([
						"flex h-8 w-full rounded border border-neutral-600 bg-[#1e1e1e] px-2 py-1 text-xs text-neutral-300 placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-red-500 focus:border-red-500 focus:ring-red-500",
						className,
					])}
					{...props}
				/>
				{error && <p className="text-xs text-red-400">{error}</p>}
				{helpText && !error && (
					<p className="text-xs text-neutral-500">{helpText}</p>
				)}
			</div>
		)
	},
)

type SelectProps = ComponentProps<"select"> & {
	label?: string
	error?: string
	helpText?: string
	placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			className,
			label,
			error,
			helpText,
			placeholder,
			id: providedId,
			children,
			...props
		},
		ref,
	) => {
		const generatedId = useId()
		const id = providedId || generatedId

		return (
			<div className="space-y-1">
				{label && (
					<label htmlFor={id} className="text-xs font-medium text-neutral-300">
						{label}
					</label>
				)}
				<select
					id={id}
					ref={ref}
					className={cn([
						"flex h-8 w-full rounded border border-neutral-600 bg-[#1e1e1e] px-2 py-1 text-xs text-neutral-300 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-red-500 focus:border-red-500 focus:ring-red-500",
						className,
					])}
					{...props}
				>
					{placeholder && (
						<option value="" disabled>
							{placeholder}
						</option>
					)}
					{children}
				</select>
				{error && <p className="text-xs text-red-400">{error}</p>}
				{helpText && !error && (
					<p className="text-xs text-neutral-500">{helpText}</p>
				)}
			</div>
		)
	},
)

type RadioProps = ComponentProps<"input"> & {
	label?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
	({ className, label, id: providedId, ...props }, ref) => {
		const generatedId = useId()
		const id = providedId || generatedId

		return (
			<div className="flex items-center space-x-2">
				<input
					id={id}
					ref={ref}
					type="radio"
					className={cn([
						"h-3 w-3 rounded-full border border-neutral-600 text-blue-600 focus:ring-1 focus:ring-blue-600 focus:ring-offset-0",
						className,
					])}
					{...props}
				/>
				{label && (
					<label
						htmlFor={id}
						className="text-xs text-neutral-300 cursor-pointer"
					>
						{label}
					</label>
				)}
			</div>
		)
	},
)

type RadioGroupProps = {
	value?: string
	onChange?: (value: string) => void
	name?: string
	children: ReactNode
	className?: string
	label?: string
}

export function RadioGroup({
	value,
	onChange,
	name,
	children,
	className,
	label,
}: RadioGroupProps) {
	const generatedId = useId()
	const groupName = name || generatedId

	return (
		<div className={cn("space-y-2", className)}>
			{label && <p className="text-xs font-medium text-neutral-300">{label}</p>}
			<div className="space-y-1">
				{Array.isArray(children)
					? children.map((child, index) => {
							const childKey =
								child &&
								typeof child === "object" &&
								"props" in child &&
								child.props.value
									? `${groupName}-${child.props.value}`
									: `${groupName}-${index}`
							return (
								<div key={childKey}>
									{child && typeof child === "object" && "props" in child
										? {
												...child,
												props: {
													...child.props,
													name: groupName,
													checked: child.props.value === value,
													onChange: () => onChange?.(child.props.value),
												},
											}
										: child}
								</div>
							)
						})
					: children}
			</div>
		</div>
	)
}

type ButtonGroupProps = {
	children: ReactNode
	className?: string
	orientation?: "horizontal" | "vertical"
}

export function ButtonGroup({
	children,
	className,
	orientation = "horizontal",
}: ButtonGroupProps) {
	const groupId = useId()

	return (
		<div
			className={cn([
				"inline-flex",
				orientation === "horizontal" ? "flex-row" : "flex-col",
				"rounded border border-neutral-600 overflow-hidden",
				className,
			])}
		>
			{Array.isArray(children)
				? children.map((child, index) => (
						<div
							key={`${groupId}-button-${String(index)}`}
							className={cn([
								orientation === "horizontal" &&
									index > 0 &&
									"border-l border-neutral-600",
								orientation === "vertical" &&
									index > 0 &&
									"border-t border-neutral-600",
							])}
						>
							{child && typeof child === "object" && "props" in child
								? {
										...child,
										props: {
											...child.props,
											className: cn([
												"rounded-none border-0 focus:z-10",
												child.props.className,
											]),
										},
									}
								: child}
						</div>
					))
				: children}
		</div>
	)
}

// Additional utility components for devtools

type SectionProps = {
	title: string
	children: ReactNode
	collapsible?: boolean
	defaultCollapsed?: boolean
	className?: string
}

export function Section({
	title,
	children,
	collapsible = false,
	defaultCollapsed = false,
	className,
}: SectionProps) {
	if (collapsible) {
		return (
			<details open={!defaultCollapsed} className={cn("space-y-2", className)}>
				<summary className="flex items-center gap-x-2 cursor-pointer text-sm font-medium text-neutral-300 hover:text-white list-none [&::-webkit-details-marker]:hidden">
					<span className="transition-transform [details[open]_&]:rotate-90">
						▶
					</span>
					{title}
				</summary>
				<div className="space-y-2 pl-6">{children}</div>
			</details>
		)
	}

	return (
		<div className={cn("space-y-2", className)}>
			<h3 className="text-sm font-medium text-neutral-300">{title}</h3>
			<div className="space-y-2">{children}</div>
		</div>
	)
}

type TabsProps = {
	children: ReactNode
	defaultValue?: string
	value?: string
	onValueChange?: (value: string) => void
	className?: string
}

export function Tabs({
	children,
	defaultValue,
	value: controlledValue,
	onValueChange,
	className,
}: TabsProps) {
	const [internalValue, setInternalValue] = useState(defaultValue || "")
	const value = controlledValue ?? internalValue
	const tabsId = useId()

	const handleValueChange = (newValue: string) => {
		if (controlledValue === undefined) {
			setInternalValue(newValue)
		}
		onValueChange?.(newValue)
	}

	return (
		<div className={cn("space-y-2", className)}>
			{/* Tab list */}
			<div
				role="tablist"
				className="flex space-x-1 border-b border-neutral-600"
				aria-orientation="horizontal"
			>
				{Array.isArray(children)
					? children.map((child) => {
							if (
								child &&
								typeof child === "object" &&
								"props" in child &&
								child.props.label
							) {
								const tabValue = child.props.value || child.props.label
								const isSelected = value === tabValue
								return (
									<button
										key={`tab-${tabValue}`}
										type="button"
										role="tab"
										id={`${tabsId}-tab-${tabValue}`}
										aria-controls={`${tabsId}-panel-${tabValue}`}
										aria-selected={isSelected}
										tabIndex={isSelected ? 0 : -1}
										onClick={() => handleValueChange(tabValue)}
										className={cn([
											"px-3 py-1 text-xs font-medium border-b-2 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400",
											isSelected
												? "border-blue-500 text-blue-400"
												: "border-transparent text-neutral-400 hover:text-neutral-300",
										])}
									>
										{child.props.label}
									</button>
								)
							}
							return null
						})
					: null}
			</div>

			{/* Tab panels */}
			{Array.isArray(children)
				? children.map((child) => {
						if (child && typeof child === "object" && "props" in child) {
							const tabValue = child.props.value || child.props.label
							const isSelected = value === tabValue

							if (!isSelected) return null

							return (
								<div
									key={`panel-${tabValue}`}
									role="tabpanel"
									id={`${tabsId}-panel-${tabValue}`}
									aria-labelledby={`${tabsId}-tab-${tabValue}`}
									tabIndex={0}
								>
									{child}
								</div>
							)
						}
						return null
					})
				: children}
		</div>
	)
}

type TabProps = {
	label: string
	value?: string
	children: ReactNode
}

export function Tab({ children }: TabProps) {
	return <div>{children}</div>
}

type CodeBlockProps = {
	children: string
	language?: string
	className?: string
	title?: string
}

export function CodeBlock({
	children,
	language,
	className,
	title,
}: CodeBlockProps) {
	return (
		<figure className={cn("space-y-1", className)}>
			{title && (
				<figcaption className="text-xs text-neutral-400 font-medium">
					{title}
				</figcaption>
			)}
			<pre className="bg-[#0d1117] border border-neutral-600 rounded p-3 text-xs font-mono text-neutral-300 overflow-auto">
				<code
					{...(language && { className: `language-${language}` })}
					data-language={language}
				>
					{children}
				</code>
			</pre>
		</figure>
	)
}
