/// <reference types="vite/client" />

declare global {
	interface Window {
		__REACT_SCAN_EXTENSION__?: boolean;
		__REACT_SCAN_VERSION__?: string;
		__REACT_SCAN_STOP__?: () => void;
		__REACT_SCAN_TOOLBAR_CONTAINER__?: HTMLElement;
		reactScanCleanupListeners?: () => void;
	}
}
