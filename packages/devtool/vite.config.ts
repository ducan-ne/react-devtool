import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		dts({
			insertTypesEntry: true,
			tsconfigPath: "./tsconfig.json",
		}),
	],
	build: {
		target: "esnext",
		minify: false,
		sourcemap: true,
		lib: {
			entry: {
				index: "./src/index.ts",
				ui: "./src/ui.tsx",
			},
			formats: ["es"],
			fileName: (format, name) => `${name}.js`,
		},
		rollupOptions: {
			external: [
				"react",
				"react/jsx-runtime",
				"react-dom/client",
				"@preact/signals",
				"preact",
				"preact/hooks",
				"preact/jsx-runtime",
			],
			output: {
				preserveModules: true,
				entryFileNames: `[name].js`,
				chunkFileNames: `[name].js`,
				assetFileNames: `[name].[ext]`,
			},
		},
	},
})
