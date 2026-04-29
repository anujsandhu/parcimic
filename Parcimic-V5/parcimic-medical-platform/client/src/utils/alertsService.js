// alertsService.js — fully client-side, no network calls

/**
 * Evaluate all alert conditions locally (no API call)
 */
export function evaluateAlerts(data) {
  const alerts = [];
  const { score, vitals, symptoms } = data || {};

  if (score > 64) {
    alerts.push({
      type: 'risk', severity: 'high',
      message: 'High risk detected. You may need immediate attention.',
      actionUrl: '/emergency',
    });
  } else if (score > 34) {
    alerts.push({
      type: 'risk', severity: 'moderate',
      message: 'Moderate risk. Keep monitoring your symptoms.',
      actionUrl: '/check',
    });
  }

  if (symptoms?.fever && vitals?.heartRate > 100) {
    alerts.push({
      type: 'symptom', severity: 'high',
      message: 'Fever with elevated heart rate. Consider seeing a doctor.',
      actionUrl: '/emergency',
    });
  }

  return Promise.resolve(alerts);
}

export function isEmergencySituation(score) {
  return typeof score === 'number' && score > 64;
}

export function getMissedMedications(medications) {
  if (!Array.isArray(medications)) return [];
  return medications.filter((med) => {
    if (med.status !== 'pending') return false;
    const [h, m] = (med.time || '00:00').split(':').map(Number);
    const now = new Date();
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return now > scheduled;
  });
}

export function getAlertActionUrl(alert) {
  if (alert.actionUrl) return alert.actionUrl;
  switch (alert.type) {
    case 'risk':       return alert.severity === 'high' ? '/emergency' : '/check';
    case 'symptom':    return '/emergency';
    case 'medication': return '/medications';
    default:           return '/';
  }
}
