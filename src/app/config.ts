// Application identity and defaults. Domain modules must not import this file.
export const appConfig = {
  id: 'foundation',
  name: 'Foundation',
  currency: 'USD',
  defaults: {
    brand: 'teal' as const,
    density: 'comfortable' as const,
    shell: 'sidebar' as const,
  },
}
