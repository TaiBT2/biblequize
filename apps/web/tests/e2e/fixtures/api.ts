/**
 * Simpler fixture — testApi only (no authenticated page contexts).
 *
 * Use this when tests handle their own page authentication (fresh login)
 * but still need the TestApi for setup/teardown/verification.
 */

import { test as base } from '@playwright/test'
import { TestApi } from '../helpers/test-api'

export const test = base.extend<{ testApi: TestApi }>({
  testApi: async ({}, use) => {
    const api = new TestApi()
    await api.init()
    await use(api)
  },
})

export { expect } from '@playwright/test'
