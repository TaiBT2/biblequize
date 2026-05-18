/**
 * Typed key registry for `common.*` namespace.
 *
 * Usage: `t(I18N_KEYS.common.loading)` thay vì `t('common.loading')`.
 * Catch typo + key-rename compile-time. Mirror apps/{web,mobile}/src/i18n/{vi,en}.json.
 *
 * Migration policy: opt-in per call site. New code SHOULD use registry;
 * existing string-literal call sites migrate khi file đó được touched.
 */
export const COMMON_KEYS = {
  loading: 'common.loading',
  retry: 'common.retry',
  cancel: 'common.cancel',
  confirm: 'common.confirm',
  save: 'common.save',
  back: 'common.back',
  next: 'common.next',
  done: 'common.done',
  error: 'common.error',
  noData: 'common.noData',
  close: 'common.close',
  yes: 'common.yes',
  no: 'common.no',
  all: 'common.all',
  delete: 'common.delete',
  edit: 'common.edit',
  create: 'common.create',
  search: 'common.search',
  viewAll: 'common.viewAll',
} as const

export type CommonKey = (typeof COMMON_KEYS)[keyof typeof COMMON_KEYS]
