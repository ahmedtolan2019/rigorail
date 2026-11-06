import { defineTranslations } from '@/shared/i18n'

// Eager strings used by the account menu. Page and sign-in strings live in messages.ts.
export const ns = defineTranslations(
  'account',
  {
    navigation: 'Account',
    signOut: 'Sign out',
    signOutFailed: 'Could not sign out. Check your connection and try again.',
  },
  {
    navigation: 'الحساب',
    signOut: 'تسجيل الخروج',
    signOutFailed: 'تعذّر تسجيل الخروج. تحقّق من الاتصال وحاول مجددًا.',
  },
)
