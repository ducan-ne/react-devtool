import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		codeInspectorPlugin({
			bundler: "vite",
		}),
		tsconfigPaths(),
		tailwindcss(),
		// preact({
		// 	include: [__dirname + "/src/devtool"],
		// 	exclude: [__dirname + "/src/*.tsx"],
		// 	reactAliasesEnabled: false,
		// 	jsxImportSource: "react",
		// }),
	],
});
