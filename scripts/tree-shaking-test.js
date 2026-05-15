import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { build } from "vite"

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
const skipBuild = process.argv.includes("--skip-build")

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`)
  }
}

const readJsFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const chunks = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      chunks.push(await readJsFiles(fullPath))
    } else if (entry.name.endsWith(".js")) {
      chunks.push(await readFile(fullPath, "utf8"))
    }
  }

  return chunks.join("\n")
}

const normalizeModuleId = (id) => path.relative(root, id).replaceAll(path.sep, "/")

const getOutput = (result) => (Array.isArray(result) ? result.flatMap((item) => item.output) : result.output)

const getChunks = (result) => getOutput(result).filter((item) => item.type === "chunk")

const getRenderedModules = (chunks) => {
  const modules = new Map()

  for (const chunk of chunks) {
    for (const [id, info] of Object.entries(chunk.modules)) {
      modules.set(normalizeModuleId(id), info)
    }
  }

  return modules
}

const assertNoForbiddenModules = (modules, forbiddenModules, caseName) => {
  const leaks = forbiddenModules.filter((moduleId) =>
    Array.from(modules.keys()).some((id) => id.endsWith(moduleId)),
  )
  if (!leaks.length) return

  throw new Error(
    `${caseName} rendered forbidden modules: ${leaks.map((leak) => JSON.stringify(leak)).join(", ")}`,
  )
}

const assertNoForbiddenExports = (modules, forbiddenRenderedExports, caseName) => {
  const leaks = []

  for (const { module: moduleId, exports } of forbiddenRenderedExports) {
    const entry = Array.from(modules.entries()).find(([id]) => id.endsWith(moduleId))
    if (!entry) continue

    const [, info] = entry
    const renderedExports = new Set(info.renderedExports ?? [])
    for (const exportName of exports) {
      if (renderedExports.has(exportName)) {
        leaks.push(`${moduleId}:${exportName}`)
      }
    }
  }

  if (!leaks.length) return

  throw new Error(
    `${caseName} rendered forbidden exports: ${leaks.map((leak) => JSON.stringify(leak)).join(", ")}`,
  )
}

const assertNoForbiddenText = (bundle, forbiddenText, caseName) => {
  const leaks = forbiddenText.filter((pattern) => bundle.includes(pattern))
  if (!leaks.length) return

  throw new Error(
    `${caseName} leaked forbidden text: ${leaks.map((leak) => JSON.stringify(leak)).join(", ")}`,
  )
}

const cases = [
  {
    name: "flags-from-root",
    code: `import { flags } from "react-devtool";\nconst store = flags({ enabled: true });\nconsole.log(store.value.enabled);\n`,
    forbiddenModules: ["dist/devtool.js", "dist/ui.js", "dist/core.js"],
    forbiddenRenderedExports: [{ module: "dist/flags2.js", exports: ["useFlag", "values"] }],
    forbiddenText: ["react-devtool-toolbar", "react-dom/client", "react-devtool-properties"],
  },
  {
    name: "use-flag-subpath",
    code: `import { useFlag } from "react-devtool/flags";\nconsole.log(typeof useFlag);\n`,
    forbiddenModules: ["dist/devtool.js", "dist/ui.js", "dist/core.js"],
    forbiddenRenderedExports: [{ module: "dist/flags2.js", exports: ["flags", "values"] }],
    forbiddenText: ["react-devtool-toolbar", "react-dom/client", "react-devtool-properties"],
  },
  {
    name: "button-from-ui",
    code: `import { Button } from "react-devtool/ui";\nconsole.log(Button);\n`,
    forbiddenModules: ["dist/devtool.js"],
    forbiddenRenderedExports: [{ module: "dist/flags2.js", exports: ["flags", "useFlag", "values"] }],
    forbiddenText: [
      "react-devtool-toolbar",
      "react-dom/client",
      "react-devtool-properties",
      "react-inspector",
      "useFlag",
    ],
  },
  {
    name: "devtool-from-root",
    code: `import { Devtool } from "react-devtool";\nconsole.log(Devtool);\n`,
    forbiddenModules: ["dist/ui.js"],
    forbiddenRenderedExports: [{ module: "dist/flags2.js", exports: ["flags", "useFlag", "values"] }],
    forbiddenText: ["react-devtool-properties"],
  },
]

if (!skipBuild) {
  run("npm", ["run", "build"])
}

const tempRoot = await mkdtemp(path.join(tmpdir(), "react-devtool-tree-shaking-"))

try {
  await mkdir(path.join(tempRoot, "node_modules"), { recursive: true })
  await symlink(root, path.join(tempRoot, "node_modules", "react-devtool"), "dir")

  for (const testCase of cases) {
    const caseRoot = path.join(tempRoot, testCase.name)
    const outDir = path.join(caseRoot, "dist")
    const entry = path.join(caseRoot, "entry.js")

    await mkdir(caseRoot, { recursive: true })
    await writeFile(entry, testCase.code)

    const result = await build({
      root: caseRoot,
      logLevel: "silent",
      configFile: false,
      build: {
        emptyOutDir: true,
        minify: true,
        sourcemap: false,
        outDir,
        rollupOptions: {
          input: entry,
          external: [
            /^react($|\/)/,
            /^react-dom($|\/)/,
            /^@preact\/signals($|\/)/,
            /^preact($|\/)/,
            "bippy",
            "web-vitals",
          ],
          output: {
            format: "es",
            entryFileNames: "bundle.js",
            chunkFileNames: "chunks/[name].js",
          },
        },
      },
    })

    const chunks = getChunks(result)
    const modules = getRenderedModules(chunks)
    const bundle = await readJsFiles(outDir)
    assertNoForbiddenModules(modules, testCase.forbiddenModules ?? [], testCase.name)
    assertNoForbiddenExports(modules, testCase.forbiddenRenderedExports ?? [], testCase.name)
    assertNoForbiddenText(bundle, testCase.forbiddenText ?? [], testCase.name)
    console.log(`✓ ${testCase.name}`)
  }
} finally {
  await rm(tempRoot, { force: true, recursive: true })
}
