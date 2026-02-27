// Cache Manager Utility
// Ensures fresh data and prevents stale cache issues

/**
 * Clear all browser caches
 */
export const clearAllCaches = async () => {
  try {
    // Clear Cache API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✓ Cache API cleared');
    }

    // Clear localStorage (except essential items)
    const essentialKeys = ['userId', 'userRole', 'selectedDeviceId', 'selectedSerialNumber', 'fullscreenActivated'];
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('✓ localStorage cleaned');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✓ sessionStorage cleared');

    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

/**
 * Check if app version has changed and clear cache if needed
 */
export const checkAndClearStaleCache = async () => {
  try {
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-store'
    });
    const versionData = await response.json();
    const currentVersion = versionData.version;
    const storedVersion = localStorage.getItem('appVersion');

    if (storedVersion && storedVersion !== currentVersion) {
      console.log(`Version changed from ${storedVersion} to ${currentVersion}, clearing cache...`);
      await clearAllCaches();
      localStorage.setItem('appVersion', currentVersion);
      return true;
    } else if (!storedVersion) {
      localStorage.setItem('appVersion', currentVersion);
    }

    return false;
  } catch (error) {
    console.error('Error checking version:', error);
    return false;
  }
};

/**
 * Force reload with cache bypass
 */
export const forceReload = () => {
  // Use location.reload(true) for hard reload (deprecated but still works)
  // Or use cache-busting parameter
  window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
};

/**
 * Get cache-busted URL
 */
export const getCacheBustedUrl = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}_${Math.random()}`;
};
