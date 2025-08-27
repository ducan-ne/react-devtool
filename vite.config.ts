import tailwindcss from "@tailwindcss/vite"
import { codeInspectorPlugin } from "code-inspector-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import dts from "vite-plugin-dts"
import treeShakeable from "rollup-plugin-tree-shakeable"

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		codeInspectorPlugin({
			bundler: "vite",
		}),
		tsconfigPaths(),
		tailwindcss(),
		dts({
			insertTypesEntry: true,
			tsconfigPath: "./tsconfig.app.json",
		}),
		treeShakeable(),
		// preact({
		// 	include: [__dirname + "/src/devtool"],
		// 	exclude: [__dirname + "/src/*.tsx"],
		// 	reactAliasesEnabled: false,
		// 	jsxImportSource: "react",
		// }),
	],
	build: {
		// enableBuildReport: true,
		target: "esnext",
		minify: false,
		sourcemap: true,
		lib: {
			entry: ["./src/devtool.tsx", "./src/ui.tsx"],
			formats: ["es"],
			fileName: () => `[name].js`,
		},
		rollupOptions: {
			preserveEntrySignatures: "strict",
			// input: {
			// 	devtool: "./src/devtool.tsx",
			// },
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				assetFileNames: "[name].[ext]",
			},
			external: [
				"react",
				"react/jsx-runtime",
				"react-dom/client",
				"@preact/signals",
				"preact",
				"preact/hooks",
				"preact/jsx-runtime",
				"@devtool",
			],
			onwarn(warning, warn) {
				if (
					warning.code === "MODULE_LEVEL_DIRECTIVE" ||
					warning.code === "EVAL" ||
					warning.code === "SOURCEMAP_ERROR" ||
					warning.code === "UNUSED_EXTERNAL_IMPORT" ||
					warning.code === "INVALID_ANNOTATION" ||
					warning.code === "CIRCULAR_DEPENDENCY"
				) {
					return
				}
				warn(warning)
			},
		},
	},
	// experimental: { enableNativePlugin: true },
})
