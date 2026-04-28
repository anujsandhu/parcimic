import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, AlertCircle, AlertTriangle,
  RefreshCw, MessageCircle, MapPin, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { llmExplain } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const RISK = {
  low: {
    label: "You're doing fine", sub: 'Your readings look normal',
    msg: "Based on what you've shared, your risk level is low. Keep monitoring how you feel and stay hydrated.",
    color: 'text-success-700', bg: 'state-safe', icon: CheckCircle, iconCls: 'text-success-500',
    badge: 'badge-safe', badgeText: 'Low Risk',
    gaugeColor: '#22C55E',
    actions: [
      'Stay well hydrated — drink plenty of water',
      'Get adequate rest and sleep',
      'Monitor your temperature if you feel unwell',
      'Re-check if your symptoms change or worsen',
    ],
  },
  medium: {
    label: 'Keep an eye on this', sub: 'Some readings need attention',
    msg: "A few of your readings are slightly outside the normal range. It's worth monitoring closely.",
    color: 'text-warning-700', bg: 'state-medium', icon: AlertTriangle, iconCls: 'text-warning-500',
    badge: 'badge-medium', badgeText: 'Needs Attention',
    gaugeColor: '#F59E0B',
    actions: [
      'Rest and avoid strenuous activity',
      'Drink fluids regularly throughout the day',
      'Check your temperature every few hours',
      'Contact your doctor if symptoms worsen',
      'Re-check your vitals in 2–4 hours',
    ],
  },
  high: {
    label: 'Please take action', sub: 'Your readings suggest you may need care',
    msg: "Your readings indicate you may need medical attention soon. Please don't ignore this.",
    color: 'text-danger-700', bg: 'state-high', icon: AlertCircle, iconCls: 'text-danger-500',
    badge: 'badge-high', badgeText: 'Needs Care',
    gaugeColor: '#EF4444',
    actions: [
      'Contact your doctor or a healthcare provider now',
      'Do not drive yourself — ask someone to take you',
      'If symptoms are severe, call emergency services (112)',
      'Stay calm and rest while you wait for help',
      'Keep someone with you until you get medical attention',
    ],
  },
};

function Gauge({ score, color }) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="gauge-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-gray-900 leading-none">{score}</span>
        <span className="text-2xs text-gray-400 font-medium">/100</span>
      </div>
    </div>
  );
}

export default function Result() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [result,      setResult]      = useState(null);
  const [explaining,  setExplaining]  = useState(false);
  const [explanation, setExplanation] = useState('');
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('sepsisResult');
    if (!raw) { navigate('/check'); return; }
    const d = JSON.parse(raw);
    if (d.riskLevel === 'moderate') d.riskLevel = 'medium';
    setResult(d);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!user || saved || !result) return;
    addDoc(collection(db, 'predictions'), {
      uid: user.uid, score: result.score, riskLevel: result.riskLevel,
      recommendation: result.recommendation || '',
      vitals: result.form ? {
        heartRate: +result.form.heartRate || null, temp: +result.form.temp || null,
        respRate: +result.form.respRate || null, sysBP: +result.form.sysBP || null, o2Sat: +result.form.o2Sat || null,
      } : {},
      createdAt: serverTimestamp(),
    }).then(() => setSaved(true)).catch(() => {});
  }, [user, result]); // eslint-disable-line

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const data = await llmExplain({ score: result.score, riskLevel: result.riskLevel, vitals: result.form, recommendation: result.recommendation });
      setExplanation(data.explanation || '');
    } catch { toast.error('Could not load recommendation. Please try again.'); }
    finally { setExplaining(false); }
  };

  if (!result) return null;
  const cfg  = RISK[result.riskLevel] || RISK.low;
  const Icon = cfg.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* ── Risk card ── */}
      <div className={`card p-8 ${cfg.bg}`}>
        <div className="flex items-center justify-between mb-6">
          <span className={cfg.badge}>{cfg.badgeText}</span>
          {result.isLocal && <span className="text-2xs text-gray-400">Local scoring</span>}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Gauge score={result.score} color={cfg.gaugeColor} />
          <div className="text-center sm:text-left">
            <h2 className={`text-2xl font-bold mb-1 ${cfg.color}`}>{cfg.label}</h2>
            <p className="text-sm text-gray-500 mb-3">{cfg.sub}</p>
            <div className="flex items-start gap-2.5 bg-white/60 rounded-lg p-3">
              <Icon size={16} className={`${cfg.iconCls} mt-0.5 shrink-0`} strokeWidth={2} />
              <p className="text-sm text-gray-700 leading-relaxed">{cfg.msg}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Parcimic AI Recommendation ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-brand-500" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Parcimic AI Recommendation</h3>
            <p className="text-2xs text-gray-400">Personalised guidance based on your readings</p>
          </div>
        </div>

        {explanation ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>
        ) : (
          <>
            {result.recommendation && (
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{result.recommendation}</p>
            )}
            {!result.recommendation && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {result.riskLevel === 'low'
                  ? "Your readings are within a healthy range. There are no immediate signs of concern."
                  : result.riskLevel === 'medium'
                  ? "One or more readings are slightly outside the normal range. This could be due to a mild infection or dehydration."
                  : "Several readings suggest your body may be under significant stress. Please seek medical advice promptly."}
              </p>
            )}
            <button onClick={handleExplain} disabled={explaining} className="btn btn-secondary btn-sm w-full">
              {explaining
                ? <><div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Getting recommendation...</>
                : <><Shield size={13} strokeWidth={2.5} /> Get detailed Parcimic AI Recommendation</>
              }
            </button>
          </>
        )}
      </div>

      {/* ── What to do ── */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">What you should do</h3>
        <ul className="space-y-3">
          {cfg.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-2xs font-bold text-brand-600">{i + 1}</span>
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Emergency (high risk only) ── */}
      {result.riskLevel === 'high' && (
        <div className="card p-6 state-high">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-danger-500" strokeWidth={2} />
            <h3 className="text-sm font-bold text-danger-700">Need immediate help?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            If you feel very unwell, have difficulty breathing, or are confused — please call emergency services now.
          </p>
          <div className="flex gap-3">
            <a href="tel:112" className="btn-danger btn flex-1 justify-center">Call 112</a>
            <button onClick={() => navigate('/emergency')} className="btn btn-secondary flex-1">
              <MapPin size={14} strokeWidth={2} /> Find Hospital
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={() => navigate('/assistant')} className="btn btn-secondary justify-center py-3">
          <MessageCircle size={15} strokeWidth={1.75} /> Ask AI a question
        </button>
        <button onClick={() => { sessionStorage.removeItem('sepsisResult'); navigate('/check'); }}
          className="btn btn-secondary justify-center py-3">
          <RefreshCw size={15} strokeWidth={1.75} /> Check again
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center leading-relaxed pb-2">
        This tool provides guidance only and is not a medical diagnosis.
        Always consult a qualified healthcare professional for medical advice.
      </p>
    </div>
  );
}
