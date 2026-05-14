import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { cn, throttle, readLocalStorage, saveLocalStorage, removeLocalStorage } from '../../../src/devtool/utils/helpers'

describe('utils/helpers', () => {
  describe('cn', () => {
    it('merges class names and resolves tailwind conflicts', () => {
      // tailwind-merge should keep the latter padding/text size
      expect(cn('p-2 text-xs', 'p-3', 'text-sm')).toContain('p-3')
      expect(cn('p-2 text-xs', 'p-3', 'text-sm')).toContain('text-sm')
      // should not contain the conflicting earlier classes
      const merged = cn('p-2 text-xs', 'p-3', 'text-sm')
      expect(merged).not.toMatch(/p-2(\s|$)/)
      expect(merged).not.toMatch(/text-xs(\s|$)/)
    })
  })

  describe('throttle', () => {
    const originalNow = Date.now
    let now = 0
    beforeEach(() => {
      now = 0
      vi.spyOn(Date, 'now').mockImplementation(() => now)
    })
    afterEach(() => {
      ;(Date.now as any) = originalNow
      vi.restoreAllMocks()
    })

    it('limits callback invocation to at most once per delay', () => {
      const cb = vi.fn()
      const throttled = throttle(cb, 100)

      throttled()
      expect(cb).toHaveBeenCalledTimes(1)

      // Within delay window
      now = 50
      throttled()
      expect(cb).toHaveBeenCalledTimes(1)

      // After delay
      now = 150
      throttled()
      expect(cb).toHaveBeenCalledTimes(2)
    })
  })

  describe('localStorage helpers', () => {
    const KEY = 'helpers:test'
    afterEach(() => {
      try {
        window.localStorage.removeItem(KEY)
      } catch {}
    })

    it('reads null when missing and round-trips values', () => {
      expect(readLocalStorage(KEY)).toBeNull()
      const value = { a: 1, b: 'x' }
      saveLocalStorage(KEY, value)
      expect(readLocalStorage(KEY)).toEqual(value)
      removeLocalStorage(KEY)
      expect(readLocalStorage(KEY)).toBeNull()
    })
  })
})

