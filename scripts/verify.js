import assert from "node:assert";

/**
 * @param {import("playwright-core").Page} page
 */
export function verify(page, assert = default_assert) {
	return assert(page);
}

/**
 * @param {import("playwright-core").Page} page
 * */
async function default_assert(page) {
	const content = await (
		await page.waitForSelector("#app > div > h1")
	).innerText();

	assert(content.includes("Vite"));
}

/**
 * @type {Record<string, (page: import("playwright-core").Page) => Promise<void>>}
 */
export const customAssertMap = {
	"simple-vite-react": async (page) => {
		await page.locator("#react-devtool-root").evaluate((root) => {
			root.shadowRoot
				?.querySelector("[data-testid='open-devtool']")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		const content = await waitForShadowText(page, "[data-testid='hello-world']");
		assert(content.includes("Hello world"));
	},
	"preact-integration": async (page) => {
		await page.waitForSelector("text=Vite + Preact");
		await page.locator("#react-devtool-root").evaluate((root) => {
			root.shadowRoot
				?.querySelector("[data-testid='open-devtool']")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		const content = await waitForShadowText(
			page,
			"[data-testid='preact-hello-world']",
		);
		assert(content.includes("Hello from Preact"));
	},
	"with-ui": async (page) => {
		// Check initial dark mode state (should be ON by default)
		const initialContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText();
		assert(initialContent.includes("Dark mode: ON"));

		// Open the devtool
		await page.locator("#react-devtool-root").evaluate((root) => {
			root.shadowRoot
				?.querySelector("[data-testid='open-devtool']")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		await page.waitForFunction(() =>
			document
				.querySelector("#react-devtool-root")
				?.shadowRoot?.textContent?.includes("Feature Flags"),
		);
		await clickShadowText(page, "button", "Feature Flags");
		await page.waitForFunction(() =>
			document
				.querySelector("#react-devtool-root")
				?.shadowRoot?.textContent?.includes("Application Features"),
		);

		// Find and click the darkMode toggle
		await clickShadowElement(page, "darkMode:");
		await page.waitForSelector(
			"[data-testid='dark-mode-value']:has-text('Dark mode: OFF')",
		);

		// Check that dark mode is now OFF
		const updatedContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText();
		assert(updatedContent.includes("Dark mode: OFF"));

		// Toggle it back ON to verify it works both ways
		await clickShadowElement(page, "darkMode:");
		await page.waitForSelector(
			"[data-testid='dark-mode-value']:has-text('Dark mode: ON')",
		);

		// Check that dark mode is back ON
		const finalContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText();
		assert(finalContent.includes("Dark mode: ON"));
	},
};

async function waitForShadowText(page, selector) {
	const handle = await page.waitForFunction((selector) => {
		const element = document
			.querySelector("#react-devtool-root")
			?.shadowRoot?.querySelector(selector);
		return element?.textContent || null;
	}, selector);
	return handle.jsonValue();
}

async function clickShadowText(page, selector, text) {
	await page.waitForFunction(
		({ selector, text }) => {
			const shadowRoot = document.querySelector("#react-devtool-root")?.shadowRoot;
			return !!Array.from(shadowRoot?.querySelectorAll(selector) ?? []).find(
				(element) => element.textContent?.includes(text),
			);
		},
		{ selector, text },
	);
	await page.locator("#react-devtool-root").evaluate(
		(root, { selector, text }) => {
			Array.from(root.shadowRoot?.querySelectorAll(selector) ?? [])
				.find((element) => element.textContent?.includes(text))
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		},
		{ selector, text },
	);
}

async function clickShadowElement(page, keyText) {
	await page.waitForFunction((keyText) => {
		const shadowRoot = document.querySelector("#react-devtool-root")?.shadowRoot;
		return !!Array.from(
			shadowRoot?.querySelectorAll(".react-devtool-preview-line") ?? [],
		)
			.find((line) => line.textContent?.includes(keyText))
			?.querySelector('input[type="checkbox"]');
	}, keyText);
	await page.locator("#react-devtool-root").evaluate((root, keyText) => {
		findInputByKey(root.shadowRoot, keyText)?.dispatchEvent(
			new MouseEvent("click", { bubbles: true }),
		);

		function findInputByKey(shadowRoot, keyText) {
			return Array.from(
				shadowRoot?.querySelectorAll(".react-devtool-preview-line") ?? [],
			)
				.find((line) => line.textContent?.includes(keyText))
				?.querySelector('input[type="checkbox"]');
		}
	}, keyText);
}
