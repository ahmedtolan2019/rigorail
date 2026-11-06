/**
 * The product logo, configurable per application. By default the Rigorail mark
 * is drawn as an inline SVG in the brand color. Set `logoUrl` (an image in
 * `public/`, for example '/logo.svg') to show your own logo instead; `src/app`
 * calls `configureBrand` from `appConfig.brand` at startup.
 */
export interface BrandOptions {
  /** Your logo image. Shown as-is on the brand tile; square images work best. */
  logoUrl?: string | null
}
let options: BrandOptions = {}
export function configureBrand(next: BrandOptions) {
  options = { ...next }
}
export const getBrand = () => options

/** Rigorail "Rail R" mark on a 32-unit grid, filled with currentColor. */
export const RIGORAIL_MARK_PATH =
  'M6 4H20L26 10V16L21 21L26 28H19L12 20V28H6Z M12 10V16H18L20 14V12L18 10Z'
