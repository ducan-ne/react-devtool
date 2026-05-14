import { fileURLToPath, URL } from "node:url";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Preact needs explicit React compatibility aliases because react-devtool's
// public API is React-first and keeps React zero-config for consumers.
export default defineConfig({
	plugins: [preact()],
	resolve: {
		alias: {
			"react-devtool": `${repoRoot}/dist/devtool.js`,
			react: "preact/compat",
			"react-dom/client": "preact/compat/client",
			"react/jsx-runtime": "preact/jsx-runtime",
		},
	},
});
