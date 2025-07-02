import tailwindcss from "@tailwindcss/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

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
			entry: "./src/devtool.tsx",
			formats: ["es"],
			fileName: () => `index.js`,
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
			external: ["react", "react/jsx-runtime", "react-dom/client"],
			onwarn(warning, warn) {
				if (
					warning.code === "MODULE_LEVEL_DIRECTIVE" ||
					warning.code === "EVAL" ||
					warning.code === "SOURCEMAP_ERROR" ||
					warning.code === "UNUSED_EXTERNAL_IMPORT" ||
					warning.code === "INVALID_ANNOTATION" ||
					warning.code === "CIRCULAR_DEPENDENCY"
				) {
					return;
				}
				warn(warning);
			},
		},
	},
	// experimental: { enableNativePlugin: true },
});
