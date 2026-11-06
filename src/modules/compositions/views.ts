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
      'global-search',
      'custom-dashboard',
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
      'rules-editor',
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
      'audit-log',
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
      'notifications-center',
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
      'comments-thread',
    ],
  },
  {
    id: 'groupDistinctive',
    views: [
      'triage',
      'timeline',
      'compare',
      'planner',
      'bin-map',
      'roster',
      'report-builder',
    ],
  },
] as const
export type CompositionView =
  (typeof compositionGroups)[number]['views'][number]
export const compositionViews = compositionGroups.flatMap(
  (group) => group.views,
) as [CompositionView, ...CompositionView[]]
