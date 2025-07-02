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
		await page.click("[data-testid='open-devtool']");
		await page.waitForTimeout(500);
		const content = await (
			await page.waitForSelector("[data-testid='hello-world']")
		).innerText();
		assert(content.includes("Hello world"));
	},
};
