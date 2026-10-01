// HealthTimeline.jsx
// Unified timeline showing predictions, symptoms, and medications

import React, { useEffect, useState } from 'react';
import { Activity, Pill, Stethoscope, ClipboardList } from 'lucide-react';
import { db, auth } from '../utils/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

function EventIcon({ type, riskLevel }) {
  const cls =
    type === 'prediction' && riskLevel === 'high'
      ? 'text-danger-500'
      : type === 'prediction'
      ? 'text-brand-500'
      : type === 'symptom'
      ? 'text-warning-600'
      : 'text-success-600';
  const Icon = type === 'prediction' ? Activity : type === 'symptom' ? Stethoscope : Pill;
  return <Icon size={18} className={cls} strokeWidth={1.9} />;
}

export default function HealthTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const uid = auth.currentUser.uid;
      const timeline = [];

      // Load predictions
      const predictionsQuery = query(
        collection(db, 'predictions'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const predictionsSnap = await getDocs(predictionsQuery);
      predictionsSnap.forEach((doc) => {
        const data = doc.data();
        timeline.push({
          id: `pred-${doc.id}`,
          type: 'prediction',
          timestamp: data.createdAt.toDate(),
          score: data.score,
          riskLevel: data.riskLevel,
          title: `Health Check: ${data.riskLevel.toUpperCase()}`,
          description: `Risk score ${data.score}/100`,
        });
      });

      // Load symptoms
      const symptomsQuery = query(
        collection(db, 'symptoms'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const symptomsSnap = await getDocs(symptomsQuery);
      symptomsSnap.forEach((doc) => {
        const data = doc.data();
        const symptoms = [];
        if (data.fever) symptoms.push('Fever');
        if (data.fatigue > 3) symptoms.push(`Fatigue (${data.fatigue}/10)`);
        if (data.cough > 3) symptoms.push(`Cough (${data.cough}/10)`);
        if (data.breathing > 3) symptoms.push(`Breathing (${data.breathing}/10)`);

        timeline.push({
          id: `sym-${doc.id}`,
          type: 'symptom',
          timestamp: data.createdAt.toDate(),
          title: 'Symptom Check-In',
          description: symptoms.length > 0 ? symptoms.join(', ') : 'No significant symptoms',
        });
      });

      // Load medications
      const medicationsQuery = query(
        collection(db, 'medications'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const medicationsSnap = await getDocs(medicationsQuery);
      medicationsSnap.forEach((doc) => {
        const data = doc.data();
        timeline.push({
          id: `med-${doc.id}`,
          type: 'medication',
          timestamp: data.createdAt.toDate(),
          title: `${data.name} Added`,
          description: `${data.dosage} - ${data.frequency}`,
          status: data.status,
        });
      });

      // Sort by timestamp descending
      timeline.sort((a, b) => b.timestamp - a.timestamp);

      setEvents(timeline);
    } catch (err) {
      console.error('[HealthTimeline] load failed:', err);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 px-4">
        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
          <ClipboardList size={22} className="text-gray-400" strokeWidth={1.75} />
        </div>
        <p className="text-gray-600">No health data yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Start by taking a health check or logging symptoms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 sm:left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline events */}
        {events.map((event, idx) => (
          <div key={event.id} className="relative pl-14 sm:pl-20">
            {/* Dot */}
            <div className="absolute left-0 top-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
              <EventIcon type={event.type} riskLevel={event.riskLevel} />
            </div>

            {/* Card */}
            <div
              className={`p-4 rounded-lg border shadow-xs ${
                event.type === 'prediction'
                  ? 'bg-blue-50 border-blue-200'
                  : event.type === 'symptom'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-purple-50 border-purple-200'
              }`}
            >
              <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 leading-snug">{event.title}</h4>
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded w-fit">
                  {event.timestamp.toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">{event.description}</p>

              {event.score !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        event.riskLevel === 'high'
                          ? 'bg-red-500'
                          : event.riskLevel === 'moderate'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${event.score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 min-w-max">
                    {event.score}/100
                  </span>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-2">
                {event.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Spacer */}
            {idx < events.length - 1 && <div className="h-4"></div>}
          </div>
        ))}
      </div>

      {/* Load more button */}
      {events.length >= 20 && (
        <button
          onClick={loadTimeline}
          className="w-full py-2 text-indigo-600 hover:text-indigo-700 font-semibold text-center border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
        >
          Load More History
        </button>
      )}
    </div>
  );
}
