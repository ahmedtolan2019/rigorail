import { defineTranslations } from '@/shared/i18n'

// Module-owned strings. Use t('key') with useTranslation(ns); common keys fall back automatically.
export const ns = defineTranslations(
  'appearance',
  {
    navigation: 'Appearance',
    appearanceSubtitle:
      'Change the application’s identity without changing its business logic.',
    brand: 'Brand',
    teal: 'Teal',
    indigo: 'Indigo',
    density: 'Density',
    comfortable: 'Comfortable',
    compact: 'Compact',
    shell: 'Navigation layout',
    sidebar: 'Sidebar',
    topbar: 'Top navigation',
    language: 'Language',
    resetPreferences: 'Reset appearance',
    previewHint: 'Changes apply across forms, lists, dialogs, and navigation.',
    themeHint: 'Follow the system or choose a fixed mode.',
    brandHint:
      'Brand colors come from design tokens, not individual components.',
    densityHint: 'Compact fits more rows on screen.',
    shellHint: 'Where the main navigation lives.',
  },
  {
    navigation: 'المظهر',
    appearanceSubtitle: 'غيّر هوية التطبيق دون تغيير منطق العمل.',
    brand: 'الهوية اللونية',
    teal: 'أخضر مزرق',
    indigo: 'نيلي',
    density: 'كثافة العرض',
    comfortable: 'مريحة',
    compact: 'مضغوطة',
    shell: 'تخطيط التنقل',
    sidebar: 'قائمة جانبية',
    topbar: 'قائمة علوية',
    language: 'اللغة',
    resetPreferences: 'إعادة ضبط المظهر',
    previewHint:
      'تُطبّق التغييرات على النماذج والقوائم ومربعات الحوار والتنقل.',
    themeHint: 'اتبع إعداد الجهاز أو اختر وضعًا ثابتًا.',
    brandHint: 'تأتي ألوان الهوية من رموز التصميم وليس من المكونات المنفردة.',
    densityHint: 'العرض المضغوط يعرض صفوفًا أكثر.',
    shellHint: 'مكان قائمة التنقل الرئيسية.',
  },
)
