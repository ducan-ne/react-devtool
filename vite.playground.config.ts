import tailwindcss from "@tailwindcss/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		codeInspectorPlugin({
			bundler: "vite",
		}),
		preact({
			include: [/\/src\/devtool\/.*\.[tj]sx?$/],
			reactAliasesEnabled: false,
			prefreshEnabled: false,
			devToolsEnabled: false,
			babel: {},
		}),
		react({
			exclude: [/\/src\/devtool\//],
		}),
		tsconfigPaths(),
		tailwindcss(),
	],
	build: {
		outDir: "playground-dist",
		emptyOutDir: true,
		sourcemap: true,
		target: "esnext",
	},
});
