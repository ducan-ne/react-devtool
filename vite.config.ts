import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		codeInspectorPlugin({
			bundler: "vite",
		}),
		preact(),
		tsconfigPaths(),
		tailwindcss(),
	],
});
