import React, { useEffect, useState } from 'react';
import { calculateHealthScore, getColorClasses, getHealthIcon } from '../utils/healthScoreService';

export default function HealthScoreCard({ riskScore = null, lastCheckDate = null }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (riskScore === null) { setLoading(false); return; }
    calculateHealthScore(riskScore).then((data) => { setHealthData(data); setLoading(false); });
  }, [riskScore]);

  if (loading || !healthData) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-16 mb-3" />
        <div className="h-5 bg-gray-100 rounded w-20 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  const colors = getColorClasses(healthData.color);

  return (
    <div className={`card p-5 ${colors.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Health Score</p>
          <p className={`text-4xl font-bold ${colors.text} leading-none`}>{healthData.healthScore}</p>
        </div>
        <span className="text-3xl">{getHealthIcon(healthData.label)}</span>
      </div>

      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${colors.badge}`}>
        {healthData.label}
      </span>

      <p className={`text-sm ${colors.text} font-medium leading-snug`}>{healthData.friendlyText}</p>

      {lastCheckDate && (
        <p className="text-xs text-gray-400 mt-3">
          Last check: {new Date(lastCheckDate).toLocaleDateString()} at{' '}
          {new Date(lastCheckDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {healthData.label === 'High Risk' && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
          Consider scheduling a doctor's appointment or seeking medical advice soon.
        </div>
      )}
    </div>
  );
}
