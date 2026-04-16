// Detect cross-tab localStorage changes via the native 'storage' event.
// No monkeypatching of native APIs — same-tab clears should use explicit
// function calls instead.

export function initStorageSync() {
  // Cross-tab detection (fires when another tab modifies localStorage)
  window.addEventListener('storage', (e) => {
    const rankedKeys = ['rankedSnapshot', 'rankedProgress', 'rankedStatus']
    if (e.key === null || rankedKeys.includes(e.key)) {
      window.dispatchEvent(new CustomEvent('rankedDataCleared', {
        detail: { method: 'cross-tab', key: e.key }
      }))
    }
  })
}

// Call this explicitly when clearing ranked data from the same tab
export function notifyRankedDataCleared() {
  window.dispatchEvent(new CustomEvent('rankedDataCleared', {
    detail: { method: 'explicit' }
  }))
}
