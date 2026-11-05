// Composition catalog. Each view is a lazy chunk registered in page.tsx.
export const compositionGroups = [
  {
    id: 'groupEveryday',
    views: [
      'dashboard',
      'master-detail',
      'kanban',
      'inbox',
      'calendar',
      'activity',
      'onboarding',
    ],
  },
  {
    id: 'groupWorkflows',
    views: [
      'approval-chain',
      'reconciliation',
      'import-mapping',
      'bulk-edit',
      'three-way-match',
    ],
  },
  {
    id: 'groupTables',
    views: [
      'line-items',
      'inline-table',
      'expandable-table',
      'gallery',
      'pivot',
      'permission-matrix',
    ],
  },
  {
    id: 'groupForms',
    views: [
      'wizard',
      'conditional-form',
      'inline-edit',
      'settings',
      'quote-builder',
    ],
  },
  {
    id: 'groupDetails',
    views: [
      'record-tabs',
      'profile',
      'document',
      'org-chart',
      'asset-detail',
      'customer-360',
    ],
  },
  {
    id: 'groupDistinctive',
    views: ['triage', 'timeline', 'compare', 'planner', 'bin-map', 'roster'],
  },
] as const
export type CompositionView =
  (typeof compositionGroups)[number]['views'][number]
export const compositionViews = compositionGroups.flatMap(
  (group) => group.views,
) as [CompositionView, ...CompositionView[]]
