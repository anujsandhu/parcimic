// offlineService.js
// Local caching and offline support for Parcimic

const CACHE_KEYS = {
  LAST_HEALTH_CHECK: 'parcimic_last_health_check',
  LAST_SYMPTOMS: 'parcimic_last_symptoms',
  EMERGENCY_NUMBERS: 'parcimic_emergency_numbers',
  MEDICATIONS: 'parcimic_medications',
  ALERTS: 'parcimic_alerts',
  LAST_SYNC: 'parcimic_last_sync',
};

/**
 * Check if browser is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Save health check result to cache
 * @param {Object} result - Health check result
 */
export function cacheHealthCheck(result) {
  try {
    localStorage.setItem(CACHE_KEYS.LAST_HEALTH_CHECK, JSON.stringify({
      data: result,
      timestamp: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[offlineService] cache health check failed:', err);
  }
}

/**
 * Get cached health check result
 * @returns {Object|null} Last cached result or null
 */
export function getCachedHealthCheck() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.LAST_HEALTH_CHECK);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const minutesOld = (Date.now() - new Date(timestamp).getTime()) / 60000;

    return {
      ...data,
      cachedAt: timestamp,
      minutesOld: Math.round(minutesOld),
    };
  } catch (err) {
    console.warn('[offlineService] get cached health check failed:', err);
    return null;
  }
}

/**
 * Save symptoms to cache
 * @param {Array} symptoms - Array of symptom entries
 */
export function cacheSymptoms(symptoms) {
  try {
    localStorage.setItem(CACHE_KEYS.LAST_SYMPTOMS, JSON.stringify({
      data: symptoms,
      timestamp: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[offlineService] cache symptoms failed:', err);
  }
}

/**
 * Get cached symptoms
 * @returns {Array|null}
 */
export function getCachedSymptoms() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.LAST_SYMPTOMS);
    return cached ? JSON.parse(cached).data : null;
  } catch (err) {
    console.warn('[offlineService] get cached symptoms failed:', err);
    return null;
  }
}

/**
 * Cache emergency numbers
 * @param {Object} numbers - { country, numbers: [{name, number, description}] }
 */
export function cacheEmergencyNumbers(numbers) {
  try {
    localStorage.setItem(CACHE_KEYS.EMERGENCY_NUMBERS, JSON.stringify(numbers));
  } catch (err) {
    console.warn('[offlineService] cache emergency numbers failed:', err);
  }
}

/**
 * Get cached emergency numbers
 * @returns {Object|null}
 */
export function getCachedEmergencyNumbers() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.EMERGENCY_NUMBERS);
    return cached ? JSON.parse(cached) : getDefaultEmergencyNumbers();
  } catch (err) {
    console.warn('[offlineService] get cached emergency numbers failed:', err);
    return getDefaultEmergencyNumbers();
  }
}

/**
 * Default emergency numbers (for offline)
 * @returns {Object}
 */
function getDefaultEmergencyNumbers() {
  return {
    country: 'Global',
    numbers: [
      { name: 'Ambulance', number: '112', description: 'International emergency number' },
      { name: 'Emergency (India)', number: '108', description: 'Ambulance service (India)' },
      { name: 'Emergency (India)', number: '100', description: 'Police/Fire (India)' },
    ],
  };
}

/**
 * Save medications to cache
 * @param {Array} medications - Array of medications
 */
export function cacheMedications(medications) {
  try {
    localStorage.setItem(CACHE_KEYS.MEDICATIONS, JSON.stringify({
      data: medications,
      timestamp: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[offlineService] cache medications failed:', err);
  }
}

/**
 * Get cached medications
 * @returns {Array|null}
 */
export function getCachedMedications() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MEDICATIONS);
    return cached ? JSON.parse(cached).data : null;
  } catch (err) {
    console.warn('[offlineService] get cached medications failed:', err);
    return null;
  }
}

/**
 * Check if offline and has cache available
 * @returns {boolean}
 */
export function hasOfflineData() {
  if (isOnline()) return false;

  const hasHealthCheck = !!localStorage.getItem(CACHE_KEYS.LAST_HEALTH_CHECK);
  const hasSymptoms = !!localStorage.getItem(CACHE_KEYS.LAST_SYMPTOMS);
  const hasMeds = !!localStorage.getItem(CACHE_KEYS.MEDICATIONS);

  return hasHealthCheck || hasSymptoms || hasMeds;
}

/**
 * Clear all cache
 */
export function clearCache() {
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn('[offlineService] clear cache failed:', err);
  }
}

/**
 * Get cache summary for debugging
 * @returns {Object}
 */
export function getCacheSummary() {
  return {
    isOnline: isOnline(),
    lastHealthCheck: getCachedHealthCheck()?.timestamp,
    lastSymptoms: JSON.parse(localStorage.getItem(CACHE_KEYS.LAST_SYMPTOMS) || '{}')?.timestamp,
    medications: getCachedMedications()?.length || 0,
    emergency: !!localStorage.getItem(CACHE_KEYS.EMERGENCY_NUMBERS),
  };
}
