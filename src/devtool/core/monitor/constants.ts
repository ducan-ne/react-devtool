/**
 * We do prototype caching for highly performant code, do not put browser specific code here without a guard.
 *
 * _{global} is also a hack that reduces the size of the bundle
 *
 * Examples:
 * @see https://github.com/ged-odoo/blockdom/blob/5849f0887ff8dc7f3f173f870ed850a89946fcfd/src/block_compiler.ts#L9
 * @see https://github.com/localvoid/ivi/blob/bd5bbe8c6b39a7be1051c16ea0a07b3df9a178bd/packages/ivi/src/client/core.ts#L13
 */

/**
 * Do not destructure exports or import React from "react" here.
 * From empirical ad-hoc testing, this breaks in certain scenarios.
 */
import * as React from "react"
import { IS_CLIENT } from "~web/utils/constants"

/**
 * useRef will be undefined in "use server"
 *
 * @see https://nextjs.org/docs/messages/react-client-hook-in-server-component
 */
const isRSC = () => !React.useRef
export const isSSR = () => !IS_CLIENT || isRSC()

interface WindowWithCypress extends Window {
	Cypress?: unknown
}

// todo
// todo

// 5 minutes

// 1 minute
