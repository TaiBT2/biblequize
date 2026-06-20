// Platform detection for the Capacitor (mobile app) target.
//
// `VITE_TARGET=capacitor` is set only in `.env.capacitor` (the mobile build),
// so this is `false` for every web build/dev/test — keeping web behavior and
// the existing test suite untouched. Mobile-only code paths branch on this.

export const isCapacitor = (): boolean =>
  import.meta.env.VITE_TARGET === 'capacitor'
