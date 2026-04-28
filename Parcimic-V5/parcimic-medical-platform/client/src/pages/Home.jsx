import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, MessageCircle, MapPin, ArrowRight,
  Pill, AlertTriangle, CheckCircle, AlertCircle,
  Clock, Plus, Bell, Shield, ChevronRight
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

// ─── Risk gauge (circular) ────────────────────────────────────────────────────
function RiskGauge({ score, riskLevel }) {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100)) / 100;
  const color = riskLevel === 'high' ? '#EF4444' : riskLevel === 'medium' ? '#F59E0B' : '#22C55E';
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="gauge-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-gray-900 leading-none">{score}</span>
        <span className="text-2xs text-gray-400 font-medium">/100</span>
      </div>
    </div>
  );
}

// ─── Risk label ───────────────────────────────────────────────────────────────
const RISK_LABEL = {
  low:    { text: "You're doing fine",    cls: 'text-success-600' },
  medium: { text: 'Keep an eye on this', cls: 'text-warning-600' },
  high:   { text: 'Please take action',  cls: 'text-danger-600'  },
};

export default function Home() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [lastResult,   setLastResult]   = useState(null);
  const [todayMeds,    setTodayMeds]    = useState([]);
  const [loadingData,  setLoadingData]  = useState(false);

  // Load last result — sessionStorage first (no auth needed)
  useEffect(() => {
    const raw = sessionStorage.getItem('sepsisResult');
    if (raw) {
      const d = JSON.parse(raw);
      if (d.riskLevel === 'moderate') d.riskLevel = 'medium';
      setLastResult(d);
    }
  }, []);

  // Load Firestore data when signed in
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    const today = new Date().toDateString();
    Promise.all([
      getDocs(query(collection(db, 'predictions'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1))),
      getDocs(query(collection(db, 'medications'),  where('uid', '==', user.uid), orderBy('createdAt', 'desc'))),
    ]).then(([predSnap, medSnap]) => {
      if (!predSnap.empty) {
        const d = predSnap.docs[0].data();
        if (d.riskLevel === 'moderate') d.riskLevel = 'medium';
        setLastResult((prev) => prev || d);
      }
      setTodayMeds(medSnap.docs.map((d) => {
        const m = { id: d.id, ...d.data() };
        return { ...m, status: m.takenDate === today ? m.status : 'pending' };
      }));
    }).catch(console.error).finally(() => setLoadingData(false));
  }, [user]);

  const pendingMeds = todayMeds.filter((m) => m.status !== 'taken');
  const isHighRisk  = lastResult?.riskLevel === 'high';
  const isMedRisk   = lastResult?.riskLevel === 'medium';

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Alert banner — only on medium/high risk ── */}
      {(isHighRisk || isMedRisk) && (
        <div className={`rounded-lg px-5 py-4 flex items-start gap-3 border ${
          isHighRisk ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'
        }`}>
          {isHighRisk
            ? <AlertCircle size={18} className="text-danger-500 shrink-0 mt-0.5" strokeWidth={2} />
            : <AlertTriangle size={18} className="text-warning-500 shrink-0 mt-0.5" strokeWidth={2} />
          }
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isHighRisk ? 'text-danger-700' : 'text-warning-700'}`}>
              {isHighRisk ? 'You may need immediate attention' : 'Keep monitoring your condition'}
            </p>
            <p className={`text-xs mt-0.5 leading-relaxed ${isHighRisk ? 'text-danger-600' : 'text-warning-600'}`}>
              {isHighRisk
                ? 'Your last health check showed a high risk level. Please contact a doctor or call 112 now.'
                : 'Your last check showed some readings that need attention. Monitor closely and re-check soon.'}
            </p>
          </div>
          {isHighRisk && (
            <a href="tel:112" className="btn-danger btn btn-sm shrink-0">Call 112</a>
          )}
        </div>
      )}

      {/* ── Hero — 2 column on desktop ── */}
      <div className="card">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit">
              <Shield size={13} strokeWidth={2.5} />
              Early Warning System
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
              Check Your Health<br />Risk Early
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-7 max-w-sm">
              Get clear insights and simple guidance in under 2 minutes. No medical knowledge needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/check')} className="btn-primary btn btn-lg">
                Start Health Check <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <button onClick={() => navigate('/assistant')} className="btn-secondary btn btn-lg">
                <MessageCircle size={16} strokeWidth={1.75} /> Ask AI
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-5">
              No medical knowledge needed · Fast results · Free to use
            </p>
          </div>

          {/* Right — status preview or placeholder */}
          <div className="hidden md:flex items-center justify-center p-10 border-l border-gray-100 bg-gray-50 rounded-r-lg">
            {lastResult ? (
              <div className="text-center space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Current Status</p>
                <RiskGauge score={lastResult.score} riskLevel={lastResult.riskLevel} />
                <div>
                  <p className={`text-base font-bold ${RISK_LABEL[lastResult.riskLevel]?.cls || 'text-gray-700'}`}>
                    {RISK_LABEL[lastResult.riskLevel]?.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Based on your last check</p>
                </div>
                <button onClick={() => navigate('/result')}
                  className="btn btn-secondary btn-sm mx-auto">
                  View details <ChevronRight size={13} />
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto shadow-sm">
                  <Activity size={32} className="text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-400">No check yet</p>
                <p className="text-xs text-gray-300">Start a check to see your status</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status + Risk — 2 cards side by side ── */}
      {lastResult && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Current Status */}
          <div className={`card p-6 ${
            isHighRisk ? 'state-high' : isMedRisk ? 'state-medium' : 'state-safe'
          }`}>
            <p className="section-label">Current Status</p>
            <div className="flex items-center gap-3 mb-3">
              {isHighRisk
                ? <AlertCircle size={22} className="text-danger-500" strokeWidth={2} />
                : isMedRisk
                ? <AlertTriangle size={22} className="text-warning-500" strokeWidth={2} />
                : <CheckCircle size={22} className="text-success-500" strokeWidth={2} />
              }
              <p className={`text-xl font-bold ${RISK_LABEL[lastResult.riskLevel]?.cls}`}>
                {RISK_LABEL[lastResult.riskLevel]?.text}
              </p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isHighRisk
                ? 'High risk based on your last check. Please seek medical attention.'
                : isMedRisk
                ? 'Some readings need attention. Monitor closely and re-check soon.'
                : 'Low risk based on your last check. Keep monitoring how you feel.'}
            </p>
            <button onClick={() => navigate('/result')}
              className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View full result <ChevronRight size={12} />
            </button>
          </div>

          {/* Risk Meter */}
          <div className="card p-6">
            <p className="section-label">Risk Score</p>
            <div className="flex items-center gap-5">
              <RiskGauge score={lastResult.score} riskLevel={lastResult.riskLevel} />
              <div>
                <p className="text-3xl font-extrabold text-gray-900 leading-none">{lastResult.score}%</p>
                <p className={`text-sm font-semibold mt-1 ${
                  isHighRisk ? 'text-danger-600' : isMedRisk ? 'text-warning-600' : 'text-success-600'
                }`}>
                  {isHighRisk ? 'High Risk' : isMedRisk ? 'Medium Risk' : 'Low Risk'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last checked</p>
              </div>
            </div>
            {/* Parcimic AI Recommendation */}
            {lastResult.recommendation && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-2xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Parcimic AI Recommendation
                </p>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {lastResult.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions — 4 cards ── */}
      <div>
        <p className="section-label">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Start Check',  desc: 'Check your risk now',       icon: Activity,      to: '/check',       iconCls: 'text-brand-500 bg-brand-50'   },
            { label: 'Add Medicine', desc: 'Track your medications',     icon: Pill,          to: '/medications', iconCls: 'text-violet-500 bg-violet-50' },
            { label: 'Emergency',    desc: 'Find nearby hospitals',      icon: MapPin,        to: '/emergency',   iconCls: 'text-danger-500 bg-danger-50' },
            { label: 'Ask AI',       desc: 'Get health guidance',        icon: MessageCircle, to: '/assistant',   iconCls: 'text-success-600 bg-success-50' },
          ].map((a) => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className="card-hover p-5 flex flex-col items-start gap-3 text-left">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.iconCls}`}>
                <a.icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Medications ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-label mb-0">Today's Medications</p>
          <button onClick={() => navigate('/medications')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            Manage <ChevronRight size={12} />
          </button>
        </div>

        <div className="card">
          {!user ? (
            <div className="px-6 py-8 text-center">
              <Pill size={28} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500 mb-1">Sign in to track medications</p>
              <p className="text-xs text-gray-400">Keep track of your daily medicines</p>
              <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm mt-4 mx-auto">
                Sign In
              </button>
            </div>
          ) : loadingData ? (
            <div className="px-6 py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayMeds.length === 0 ? (
            <div className="px-6 py-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">No medications added yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Add your daily medicines to track them</p>
              </div>
              <button onClick={() => navigate('/medications')} className="btn btn-secondary btn-sm shrink-0">
                <Plus size={13} strokeWidth={2.5} /> Add
              </button>
            </div>
          ) : (
            <div>
              {pendingMeds.length > 0 && (
                <div className="px-5 py-3 bg-warning-50 border-b border-warning-100 flex items-center gap-2">
                  <Bell size={14} className="text-warning-500" strokeWidth={2} />
                  <span className="text-xs font-semibold text-warning-700">
                    {pendingMeds.length} medication{pendingMeds.length > 1 ? 's' : ''} still to take today
                  </span>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {todayMeds.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      m.status === 'taken' ? 'bg-success-50' : 'bg-gray-100'
                    }`}>
                      {m.status === 'taken'
                        ? <CheckCircle size={15} className="text-success-600" strokeWidth={2} />
                        : <Clock size={15} className="text-gray-400" strokeWidth={1.75} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${m.status === 'taken' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.dosage} · {m.time}</p>
                    </div>
                    {m.status === 'taken'
                      ? <span className="badge-safe text-2xs shrink-0">Taken</span>
                      : <span className="badge-medium text-2xs shrink-0">Pending</span>
                    }
                  </div>
                ))}
                {todayMeds.length > 4 && (
                  <button onClick={() => navigate('/medications')}
                    className="w-full px-5 py-3 text-xs font-semibold text-brand-600 hover:bg-gray-50 transition-colors text-left">
                    +{todayMeds.length - 4} more medications
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Emergency section — context-aware ── */}
      <div className={`card p-6 ${isHighRisk ? 'state-high' : ''}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={16} className={isHighRisk ? 'text-danger-500' : 'text-gray-400'} strokeWidth={2} />
              <h3 className={`text-sm font-bold ${isHighRisk ? 'text-danger-700' : 'text-gray-900'}`}>
                {isHighRisk ? 'Get help now' : 'Emergency Help'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {isHighRisk
                ? 'Your risk level is high. Call emergency services or find the nearest hospital immediately.'
                : "If you feel very unwell, don't wait — call emergency services or find a nearby hospital."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="tel:112" className="btn-danger btn btn-sm">Call 112</a>
            <button onClick={() => navigate('/emergency')} className="btn btn-secondary btn-sm">
              <MapPin size={13} strokeWidth={2} /> Find Hospital
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
