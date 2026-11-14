import { defineTranslations } from '@/shared/i18n'

// Permission labels, read only on the access screens; they load with them, not at startup.
defineTranslations(
  'requests',
  {
    permissionRead: 'View requests',
    permissionCreate: 'Create requests',
    permissionEdit: 'Edit a draft',
    permissionSubmit: 'Submit for approval',
    permissionApprove: 'Approve a request',
    permissionSuggest: 'Generate a suggestion',
  },
  {
    permissionRead: 'عرض الطلبات',
    permissionCreate: 'إنشاء طلبات',
    permissionEdit: 'تعديل مسودة',
    permissionSubmit: 'إرسال للمراجعة',
    permissionApprove: 'اعتماد طلب',
    permissionSuggest: 'إنشاء اقتراح',
  },
)
