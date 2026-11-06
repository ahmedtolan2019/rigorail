import { render } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { configureBrand } from './brand'
import { BrandMark } from './brand-mark'

afterEach(() => configureBrand({}))

test('draws the default mark until a logo is configured', () => {
  const { container, rerender } = render(<BrandMark />)
  expect(container.querySelector('svg path')).not.toBeNull()
  expect(container.querySelector('img')).toBeNull()

  configureBrand({ logoUrl: '/logo.svg' })
  rerender(<BrandMark className="size-11" />)
  const image = container.querySelector('img')!
  expect(image.getAttribute('src')).toBe('/logo.svg')
  expect(image.className).toContain('size-11')
  expect(container.querySelector('svg')).toBeNull()
})
