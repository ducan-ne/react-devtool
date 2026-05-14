// @ts-check
// copied from https://github.com/rolldown/rolldown-vite-eco-ci/blob/main/packages/build-tester/index.mjs
import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import treeKill from "tree-kill";
import { customAssertMap, verify } from "./verify.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const appDir = path.resolve(__dirname, "../integrations");
const list = fs
	.readdirSync(appDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

const rootDir = path.resolve(__dirname, "..");
const viteBin = path.resolve(rootDir, "node_modules/vite/bin/vite.js");
const host = "127.0.0.1";
const port = 4321;
const baseUrl = `http://${host}:${port}/`;

// ignore app list
const ignoreList = [];
const includeList = process.argv.slice(2);

let hasError = false;
const browser = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
for (const appName of list) {
	if (ignoreList.includes(appName)) {
		console.warn(`Ignoring ${appName}`);
		continue;
	}
	if (includeList.length > 0 && !includeList.includes(appName)) {
		console.warn(`Ignoring ${appName} since it is not included`);
		continue;
	}
	const abPath = path.resolve(appDir, appName);
	if (!fs.existsSync(path.resolve(abPath, "package.json"))) {
		console.warn(`Ignoring ${appName} since it does not contain a package.json`);
		continue;
	}
	let err;
	try {
		await runInApp(abPath, appName, browser);
	} catch (e) {
		err = e;
		hasError = true;
	} finally {
		if (err) {
			console.error(`Error: ${err} when executed ${appName}`, err);
		} else {
			console.log(`Case-${appName} : Success`);
		}
	}
}
await browser.close();

if (hasError) {
	process.exit(1);
}

/**
 * @param {string} dirPath
 * @param {string} caseName
 * @param {import("playwright-core").Browser} browser
 *
 * */
function runInApp(dirPath, caseName, browser) {
	return new Promise((resolve, reject) => {
		const p = spawn(
			process.execPath,
			[viteBin, dirPath, "--host", host, "--port", `${port}`, "--strictPort"],
			{
				cwd: rootDir,
				stdio: ["ignore", "pipe", "pipe"],
				env: {
					...process.env,
					NODE_PATH: path.resolve(rootDir, "node_modules"),
				},
			},
		);

		let output = "";
		p.stdout?.on("data", (data) => {
			output += data;
		});
		p.stderr?.on("data", (data) => {
			output += data;
		});
		p.on("error", reject);

		waitForServer(p).then(runTest, (err) => {
			cleanUp(p.exitCode ?? -1, () => reject(err));
		});
		async function runTest() {
			let exitCode = p.exitCode;
			let err;
			try {
				await testInBrowser();
			} catch (e) {
				console.error(output);
				err = e;
				exitCode = -1;
			} finally {
				cleanUp(exitCode, () => {
					if (err) {
						reject(err);
					} else {
						resolve(undefined);
					}
				});
			}
		}

		async function testInBrowser() {
			const page = await browser.newPage();
			const browserLogs = [];
			page.on("console", (message) =>
				browserLogs.push(`[${message.type()}] ${message.text()}`),
			);
			page.on("pageerror", (error) =>
				browserLogs.push(`[pageerror] ${error.message}`),
			);

			await page.goto(baseUrl);

			try {
				await verify(page, customAssertMap[caseName]);
			} catch (err) {
				if (browserLogs.length > 0) {
					console.error(browserLogs.join("\n"));
				}
				throw new Error(err);
			} finally {
				await page.close();
			}

			// Teardown
		}

		function cleanUp(_exitCode, cb) {
			if (!p.pid || p.killed) {
				cb();
				return;
			}
			treeKill(p.pid, cb);
		}

		async function waitForServer(process) {
			const deadline = Date.now() + 30_000;
			while (Date.now() < deadline) {
				if (process.exitCode !== null) {
					throw new Error(
						`Dev server exited early with code ${process.exitCode}\n${output}`,
					);
				}
				try {
					const response = await fetch(baseUrl);
					if (response.ok) {
						return;
					}
				} catch {
					// Server is not listening yet.
				}
				await new Promise((resolve) => setTimeout(resolve, 250));
			}
			throw new Error(`Timed out waiting for dev server at ${baseUrl}\n${output}`);
		}
	});
}
