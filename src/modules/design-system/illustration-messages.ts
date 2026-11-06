import { defineTranslations } from '@/shared/i18n'
import type { IllustrationName } from '@/shared/ui/illustration'

// Every registered asset needs a localized name and a concrete suggested use.
const copy = {
  empty: [
    'Empty',
    'A list with no records yet.',
    'قائمة فارغة',
    'قائمة لم تُضف إليها سجلات بعد.',
  ],
  'no-results': [
    'No results',
    'A search or filter with no matches.',
    'لا توجد نتائج',
    'بحث أو تصفية بلا نتائج مطابقة.',
  ],
  error: [
    'Error',
    'A failed operation with a retry action.',
    'خطأ',
    'عملية لم تكتمل مع إجراء لإعادة المحاولة.',
  ],
  offline: [
    'Offline',
    'A lost connection with recovery guidance.',
    'دون اتصال',
    'انقطاع الاتصال مع إرشادات لاستعادته.',
  ],
  'not-found': [
    'Not found',
    'An unavailable page or missing record.',
    'غير موجود',
    'صفحة غير متاحة أو سجل غير موجود.',
  ],
  'access-denied': [
    'Access denied',
    'A restricted area with a safe next step.',
    'الوصول غير مسموح',
    'قسم مقيّد مع توضيح الخطوة التالية.',
  ],
  workspace: [
    'Workspace',
    'Workspace setup or subtle sidebar decoration.',
    'مساحة العمل',
    'إعداد مساحة العمل أو زخرفة هادئة للشريط الجانبي.',
  ],
  welcome: [
    'Welcome',
    'A first visit or onboarding introduction.',
    'مرحبًا',
    'الزيارة الأولى أو بداية خطوات الإعداد.',
  ],
  success: [
    'Success',
    'A completed setup, submission or milestone.',
    'اكتمل بنجاح',
    'اكتمال الإعداد أو الإرسال أو مرحلة من العمل.',
  ],
  upload: [
    'Upload',
    'An upload drop zone or import introduction.',
    'رفع الملفات',
    'منطقة رفع الملفات أو بدء الاستيراد.',
  ],
  download: [
    'Download',
    'An export that is ready to download.',
    'تنزيل الملفات',
    'ملف تصدير جاهز للتنزيل.',
  ],
  documents: [
    'Documents',
    'A document library or attachment collection.',
    'المستندات',
    'مكتبة مستندات أو مجموعة مرفقات.',
  ],
  analytics: [
    'Analytics',
    'A report introduction or first dashboard.',
    'التحليلات',
    'مقدمة تقرير أو لوحة متابعة جديدة.',
  ],
  approvals: [
    'Approvals',
    'A review queue or approval workflow.',
    'الموافقات',
    'قائمة مراجعة أو مسار موافقات.',
  ],
  team: [
    'Team',
    'Invitations, team setup or collaboration.',
    'الفريق',
    'الدعوات أو إعداد الفريق أو التعاون.',
  ],
  security: [
    'Security',
    'Account protection or security setup.',
    'الأمان',
    'حماية الحساب أو إعدادات الأمان.',
  ],
  schedule: [
    'Schedule',
    'An empty calendar or scheduling introduction.',
    'الجدول الزمني',
    'تقويم فارغ أو مقدمة لجدولة المواعيد.',
  ],
  integrations: [
    'Integrations',
    'A connection directory or setup guide.',
    'التكاملات',
    'دليل الاتصالات أو خطوات إعداد التكامل.',
  ],
  archive: [
    'Archive',
    'An archive introduction or retention settings.',
    'الأرشيف',
    'مقدمة الأرشيف أو إعدادات الاحتفاظ.',
  ],
  billing: [
    'Billing',
    'An invoice list or billing setup.',
    'الفواتير',
    'قائمة فواتير أو إعداد الفوترة.',
  ],
  support: [
    'Support',
    'A help center or support entry point.',
    'الدعم',
    'مركز المساعدة أو بداية طلب الدعم.',
  ],
  maintenance: [
    'Maintenance',
    'A maintenance notice with a return time.',
    'الصيانة',
    'إشعار صيانة مع موعد العودة للخدمة.',
  ],
  notifications: [
    'Notifications',
    'Notification preferences or an empty inbox.',
    'الإشعارات',
    'تفضيلات الإشعارات أو صندوق وارد فارغ.',
  ],
  growth: [
    'Growth',
    'A milestone, learning path or getting started.',
    'التقدم',
    'إنجاز مرحلة أو مسار تعلّم أو بدء الاستخدام.',
  ],
} satisfies Record<IllustrationName, readonly [string, string, string, string]>

export const ns = defineTranslations(
  'design-system-illustrations',
  {
    title: 'A little room for illustration',
    hint: 'Transparent, neutral artwork for states, workflows and quiet corners. Try light or dark mode; change the brand in Appearance.',
    count: '{{count}} illustrations',
    search: 'Search illustrations or uses',
    copy: 'Copy JSX for {{name}}',
    copied: 'Copied {{name}}.',
    copyFailed:
      'Clipboard unavailable. Select and copy the code under the illustration.',
    noResults: 'No matching illustrations',
    tryAgain: 'Try a shorter search or clear the filter.',
    ...Object.fromEntries(
      Object.entries(copy).flatMap(([name, item]) => [
        [`${name}Name`, item[0]],
        [`${name}Hint`, item[1]],
      ]),
    ),
  },
  {
    title: 'مساحة صغيرة للرسوم التوضيحية',
    hint: 'رسوم شفافة بألوان محايدة للحالات ومسارات العمل والزوايا الهادئة. جرّب الوضع الفاتح أو الداكن، وغيّر لون العلامة التجارية من إعدادات المظهر.',
    count: '{{count}} رسمًا توضيحيًا',
    search: 'ابحث عن رسم أو استخدام',
    copy: 'نسخ كود JSX لرسم {{name}}',
    copied: 'تم نسخ {{name}}.',
    copyFailed: 'الحافظة غير متاحة. حدّد الكود أسفل الرسم وانسخه.',
    noResults: 'لا توجد رسوم مطابقة',
    tryAgain: 'جرّب عبارة أقصر أو امسح التصفية.',
    ...Object.fromEntries(
      Object.entries(copy).flatMap(([name, item]) => [
        [`${name}Name`, item[2]],
        [`${name}Hint`, item[3]],
      ]),
    ),
  },
)
