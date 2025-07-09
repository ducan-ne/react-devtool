import assert from "node:assert"

/**
 * @param {import("playwright-core").Page} page
 */
export function verify(page, assert = default_assert) {
	return assert(page)
}

/**
 * @param {import("playwright-core").Page} page
 * */
async function default_assert(page) {
	const content = await (
		await page.waitForSelector("#app > div > h1")
	).innerText()

	assert(content.includes("Vite"))
}

/**
 * @type {Record<string, (page: import("playwright-core").Page) => Promise<void>>}
 */
export const customAssertMap = {
	"simple-vite-react": async (page) => {
		await page.click("[data-testid='open-devtool']")
		await page.waitForTimeout(500)
		const content = await (
			await page.waitForSelector("[data-testid='hello-world']")
		).innerText()
		assert(content.includes("Hello world"))
	},
	"with-ui": async (page) => {
		// Check initial dark mode state (should be ON by default)
		const initialContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText()
		assert(initialContent.includes("Dark mode: ON"))

		// Open the devtool
		await page.click("[data-testid='open-devtool']")
		await page.waitForTimeout(500)

		// Navigate to Feature Flags tab
		await page.click("text=Feature Flags")
		await page.waitForTimeout(300)

		// Find and click the darkMode toggle
		const darkModeToggle = page.locator(
			'.react-devtool-preview-line:has(.react-devtool-key:text("darkMode:")) .react-devtool-toggle input[type="checkbox"]',
		)
		await darkModeToggle.click()
		await page.waitForTimeout(300)

		// Check that dark mode is now OFF
		const updatedContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText()
		assert(updatedContent.includes("Dark mode: OFF"))

		// Toggle it back ON to verify it works both ways
		await darkModeToggle.click()
		await page.waitForTimeout(300)

		// Check that dark mode is back ON
		const finalContent = await (
			await page.waitForSelector("[data-testid='dark-mode-value']")
		).innerText()
		assert(finalContent.includes("Dark mode: ON"))
	},
	"preact-integration": async (page) => {
		// Open the devtool
		await page.click("[data-testid='open-devtool']")
		await page.waitForTimeout(500)

		// Check that our preact integration test content is visible
		const content = await (
			await page.waitForSelector("[data-testid='preact-integration']")
		).innerText()
		assert(content.includes("Preact Integration Test"))

		// Test that the increment button works correctly
		const initialCountText = await page
			.locator("[data-testid='preact-integration'] p")
			.last()
			.innerText()
		const initialCount = parseInt(initialCountText.match(/\d+/)[0], 10)

		await page.click("[data-testid='preact-integration'] button")
		await page.waitForTimeout(300)

		const updatedCountText = await page
			.locator("[data-testid='preact-integration'] p")
			.last()
			.innerText()
		const updatedCount = parseInt(updatedCountText.match(/\d+/)[0], 10)

		assert(
			updatedCount === initialCount + 10,
			"Count should increase by 10 after clicking button",
		)
	},
}
