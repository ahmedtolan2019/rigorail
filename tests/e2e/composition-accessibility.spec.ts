import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { compositionViews } from '../../src/modules/compositions/views'

// Every composition is copied into real products, so each must pass the same
// automated WCAG 2.2 AA audit as the product screens.
for (const theme of ['light', 'dark'] as const)
  for (const view of compositionViews)
    test(`composition ${view} (${theme}) has no automated accessibility violations`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem('rigorail:theme', value),
        theme,
      )
      await page.goto(`/compositions?view=${view}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        results.violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes
              .slice(0, 3)
              .map((node) => node.target.join(' '))
              .join(' | ')}`,
        ),
      ).toEqual([])
    })
