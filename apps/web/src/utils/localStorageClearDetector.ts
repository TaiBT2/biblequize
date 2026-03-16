// Utility to detect localStorage clear
export const detectLocalStorageClear = () => {
  let lastKnownKeys: string[] = []
  
  // Initialize with current keys
  const updateKnownKeys = () => {
    lastKnownKeys = Object.keys(localStorage)
  }
  updateKnownKeys()
  
  // Override localStorage.clear to dispatch custom event
  const originalClear = localStorage.clear.bind(localStorage)
  localStorage.clear = function() {
    console.log('localStorage.clear() was called programmatically')
    originalClear()
    lastKnownKeys = []
    window.dispatchEvent(new CustomEvent('localStorageCleared', { 
      detail: { method: 'programmatic' } 
    }))
  }
  
  // Override localStorage.removeItem to detect manual removal
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  localStorage.removeItem = function(key: string) {
    console.log('localStorage.removeItem() called for:', key)
    originalRemoveItem(key)
    updateKnownKeys()
    
    // Check if ranked data was removed
    if (key === 'rankedSnapshot' || key === 'rankedProgress') {
      console.log('Ranked data removed, triggering restore...')
      window.dispatchEvent(new CustomEvent('localStorageCleared', { 
        detail: { method: 'removeItem', key } 
      }))
    }
  }
  
  // Detect manual clear via DevTools or other means
  const checkForClear = () => {
    const currentKeys = Object.keys(localStorage)
    const rankedKeys = ['rankedSnapshot', 'rankedProgress', 'rankedStatus']
    
    // Check if ranked keys disappeared
    const rankedKeysExist = rankedKeys.some(key => currentKeys.includes(key))
    const lastRankedKeysExist = rankedKeys.some(key => lastKnownKeys.includes(key))
    
    if (lastRankedKeysExist && !rankedKeysExist) {
      console.log('Ranked data was cleared manually, triggering restore...')
      window.dispatchEvent(new CustomEvent('localStorageCleared', { 
        detail: { method: 'manual', clearedKeys: rankedKeys } 
      }))
    }
    
    // Check if localStorage was completely cleared
    if (lastKnownKeys.length > 0 && currentKeys.length === 0) {
      console.log('localStorage was completely cleared, triggering restore...')
      window.dispatchEvent(new CustomEvent('localStorageCleared', { 
        detail: { method: 'complete' } 
      }))
    }
    
    updateKnownKeys()
  }
  
  // Check periodically for clear
  setInterval(checkForClear, 500) // Check every 500ms for faster detection
}

// Auto-initialize
if (typeof window !== 'undefined') {
  detectLocalStorageClear()
}
