# Access contract

Route `/access`; public export is the lazy loader. Displays session permission
catalog using each domain's label keys, subscription status, all supplied quota usage and business configuration. Refresh
invalidates session/config/capability data. Demo mode also exposes persona,
workspace, plan and rollout controls, provided through shared services.
No domain role-name checks belong in UI. Production values come from the backend.
