// HealthTimeline.jsx
// Unified timeline showing predictions, symptoms, and medications

import React, { useEffect, useState } from 'react';
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
          icon: data.riskLevel === 'high' ? '🚨' : data.riskLevel === 'moderate' ? '⚠️' : '✅',
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
          icon: '🤒',
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
          icon: '💊',
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
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-3xl mb-2">📊</p>
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
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-gray-200"></div>

        {/* Timeline events */}
        {events.map((event, idx) => (
          <div key={event.id} className="relative pl-20">
            {/* Dot */}
            <div className="absolute left-0 top-2 w-12 h-12 bg-white border-4 border-indigo-200 rounded-full flex items-center justify-center text-lg">
              {event.icon}
            </div>

            {/* Card */}
            <div
              className={`p-4 rounded-lg border shadow-sm ${
                event.type === 'prediction'
                  ? 'bg-blue-50 border-blue-200'
                  : event.type === 'symptom'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-purple-50 border-purple-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
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
