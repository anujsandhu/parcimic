// useAlerts.js — synchronous, client-side only, no network calls

import { useMemo } from 'react';
import { isEmergencySituation, getMissedMedications } from '../utils/alertsService';

export function useAlerts(data, enabled = true) {
  // Derive alerts synchronously — no useEffect, no setState, no loop
  const alerts = useMemo(() => {
    if (!enabled || !data?.uid) return [];

    const result = [];
    const { score, vitals, symptoms, medications } = data;

    if (score > 64) {
      result.push({ type: 'risk', severity: 'high', message: 'High risk detected. You may need immediate attention.', actionUrl: '/emergency' });
    } else if (score > 34) {
      result.push({ type: 'risk', severity: 'moderate', message: 'Moderate risk. Keep monitoring your symptoms.', actionUrl: '/check' });
    }

    if (symptoms?.fever && vitals?.heartRate > 100) {
      result.push({ type: 'symptom', severity: 'high', message: 'Fever with elevated heart rate. Consider seeing a doctor.', actionUrl: '/emergency' });
    }

    const missed = getMissedMedications(medications);
    if (missed.length > 0) {
      result.push({ type: 'medication', severity: 'low', message: `${missed.length} medication${missed.length > 1 ? 's' : ''} still to take today.`, actionUrl: '/medications' });
    }

    return result;
  }, [data?.uid, data?.score, data?.vitals?.heartRate, data?.symptoms?.fever, enabled]); // eslint-disable-line

  const emergencySituation = useMemo(
    () => isEmergencySituation(data?.score),
    [data?.score]
  );

  return { alerts, activeAlerts: alerts.filter((a) => a.severity !== 'low'), emergencySituation };
}
