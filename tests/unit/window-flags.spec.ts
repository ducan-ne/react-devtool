import { beforeEach, describe, expect, it } from "vitest"
import { act } from "react-dom/test-utils"
import { createElement } from "react"
import { render } from "@testing-library/react"
import { flags } from "../../src/flags"
import {
	buildFlagsLlmsText,
	isWindowFlagsActive,
	mountWindowFlags,
	unmountWindowFlags,
} from "../../src/window-flags"
import { Devtool } from "../../src/devtool"

describe("window.flags", () => {
	beforeEach(() => {
		localStorage.clear()
		unmountWindowFlags()
	})

	it("is inactive until Devtool mounts", () => {
		flags({ featureA: false }, { name: "featureFlags" })
		expect(window.flags).toBeUndefined()
		expect(isWindowFlagsActive()).toBe(false)
	})

	it("exposes registered flag sets while Devtool is mounted", () => {
		const featureFlags = flags(
			{ featureA: false, featureB: true },
			{ name: "featureFlags" },
		)

		mountWindowFlags()

		expect(window.flags?.featureFlags).toEqual({
			featureA: false,
			featureB: true,
		})

		act(() => {
			window.flags!.featureFlags.featureA = true
		})

		expect(featureFlags.value.featureA).toBe(true)
		expect(window.flags?.featureFlags.featureA).toBe(true)
	})

	it("supports bulk updates on a flag set", () => {
		const featureFlags = flags({ featureA: false, featureB: false }, { name: "bulkFlags" })
		mountWindowFlags()

		act(() => {
			window.flags!.bulkFlags = { featureA: true, featureB: true, unknown: true }
		})

		expect(featureFlags.value).toEqual({ featureA: true, featureB: true })
	})

	it("documents registered flags in llms text", () => {
		flags({ featureA: false }, { name: "docsFlags" })
		mountWindowFlags()

		expect(buildFlagsLlmsText()).toContain("docsFlags")
		expect(buildFlagsLlmsText()).toContain("featureA (default: false)")
		expect(window.flags?.llms).toContain("window.flags.<setName>.<flagName>")
	})

	it("mounts and unmounts with Devtool lifecycle", () => {
		flags({ featureA: false }, { name: "lifecycleFlags" })

		const { unmount } = render(
			createElement(Devtool, null, createElement("div", null, "panel")),
		)

		expect(window.flags).toBeDefined()
		expect(window.flags?.lifecycleFlags.featureA).toBe(false)

		unmount()

		expect(window.flags).toBeUndefined()
	})
})
