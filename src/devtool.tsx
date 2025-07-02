import { useEffect, type ReactNode } from "react";
import { scan } from "@devtool/core/index";
import { userChildren } from "@devtool/state";
import { signal, type Signal } from "@preact/signals";
import type { Subscribable } from "./ui";

type DevtoolProps = {
	children: ReactNode;
};

/**
 * @public
 */
export const Devtool = ({ children }: DevtoolProps) => {
	useEffect(() => {
		scan({
			enabled: true,
			showToolbar: true,
			showFPS: false,
		});

		userChildren.value = children;

		return () => {
			userChildren.value = null;
		};
	}, [children]);

	// This component only sets up the devtool and doesn't render anything itself.
	return null;
};

type Values<T> = Signal<T> & Subscribable<T>;

export function values<T>(values: T): Values<T> {
	return signal(values) as Values<T>;
}

type Flags<T> = Signal<T> & Subscribable<T>;

export function flags<T>(values: T): Flags<T> {
	return signal(values) as Flags<T>;
}
