# 2026-05-19 — Fix mobile crash: Hermes thiếu `SharedArrayBuffer`

> **Source**: Lỗi runtime sau `npx expo run:android` lần đầu trên Pixel_7 AVD (API 34).
> Red screen: `[runtime not ready]: ReferenceError: Property 'SharedArrayBuffer' doesn't exist`.
> Stack origin: `react-native-worklets/plugin/index.js:477` (transitive dep của `react-native-reanimated ~4.1.1`).
> **Scope**: chỉ `apps/mobile` — polyfill ở entry file, không đụng node_modules / không thêm dep.

### Tasks

- BL-MOB-HERMES-1 Tạo `apps/mobile/polyfills.ts` assign `globalThis.SharedArrayBuffer = ArrayBuffer` nếu undefined
  - Status: [ ] TODO
  - Files: `apps/mobile/polyfills.ts` (new)
  - Test: emulator load app không còn red screen
  - **Spec impact**: [x] None (workaround Hermes engine limit)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · rebuild · app render Home · commit

- BL-MOB-HERMES-2 Edit `apps/mobile/index.ts` import polyfills đầu tiên
  - Status: [ ] TODO
  - Files: `apps/mobile/index.ts`
  - Test: app khởi động không crash; `adb logcat ReactNativeJS` không còn lỗi SharedArrayBuffer
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · rebuild verify · commit

### Notes

- Fix tạm thời. Khi Expo SDK upgrade hoặc Hermes expose `SharedArrayBuffer` native, polyfill có thể bỏ.
- Polyfill assign `ArrayBuffer` (non-shared) cho `SharedArrayBuffer` — đủ cho worklets plugin recognize global name. Nếu reanimated worklets thực sự cần shared memory (multithread), sẽ phải tìm fix khác — chưa thấy use case này trong code mobile hiện tại.
