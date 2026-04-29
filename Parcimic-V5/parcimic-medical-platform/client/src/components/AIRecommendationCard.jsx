import React from 'react';
import { Shield, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AIRecommendationCard({ recommendation = null, score = null }) {
  if (!recommendation) return null;

  const isHigh = score >= 65;
  const isMed  = score >= 35 && score < 65;

  const Icon    = isHigh ? AlertCircle : isMed ? AlertTriangle : CheckCircle;
  const iconCls = isHigh ? 'text-danger-500' : isMed ? 'text-warning-500' : 'text-success-500';
  const bg      = isHigh ? 'state-high' : isMed ? 'state-medium' : 'state-safe';

  return (
    <div className={`card p-5 ${bg}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center">
          <Shield size={14} className="text-brand-500" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Parcimic AI Recommendation</p>
          <p className="text-xs text-gray-500">Based on your readings</p>
        </div>
        <Icon size={16} className={`${iconCls} ml-auto shrink-0`} strokeWidth={2} />
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
      <p className="text-xs text-gray-400 mt-3">
        AI guidance only — not a substitute for professional medical advice.
      </p>
    </div>
  );
}
