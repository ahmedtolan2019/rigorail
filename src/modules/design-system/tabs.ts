export const designSystemTabs = [
  'foundations',
  'components',
  'patterns',
  'illustrations',
  'catalog',
] as const
export type DesignSystemTab = (typeof designSystemTabs)[number]
