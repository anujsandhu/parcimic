import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, MessageCircle, MapPin, ArrowRight,
  Pill, AlertTriangle, CheckCircle, AlertCircle,
  Clock, Plus, Bell, ChevronRight
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import OfflineIndicator from '../components/OfflineIndicator';
import AlertsBanner from '../components/AlertsBanner';
import EmergencyCard from '../components/EmergencyCard';
import AIRecommendationCard from '../components/AIRecommendationCard';
import SymptomsCheckIn from '../components/SymptomsCheckIn';
import { useAlerts } from '../hooks/useAlerts';
import { cacheHealthCheck, cacheMedications } from '../utils/offlineService';

// ─── Circular risk meter ──────────────────────────────────────────────────────
function RiskMeter({ score, riskLevel }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100)) / 100;
  const color = riskLevel === 'high' ? '#EF4444' : riskLevel === 'moderate' ? '#F59E0B' : '#22C55E';
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="gauge-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 leading-none">{score}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">/100</span>
      </div>
    </div>
  );
}

const RISK = {
  low:      { label: "You're doing fine",   color: 'text-success-600', bg: 'state-safe',   Icon: CheckCircle  },
  moderate: { label: 'Keep an eye on this', color: 'text-warning-600', bg: 'state-medium', Icon: AlertTriangle },
  high:     { label: 'Please take action',  color: 'text-danger-600',  bg: 'state-high',   Icon: AlertCircle  },
};

export default function Home() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [lastResult,     setLastResult]     = useState(null);
  const [todayMeds,      setTodayMeds]      = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [loadingData,    setLoadingData]    = useState(false);
  const [showEmergency,  setShowEmergency]  = useState(false);
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const handleDismissEmergency = () => {
    setShowEmergency(false);
    setEmergencyDismissed(true);
    // Store dismissal in sessionStorage so it doesn't show again this session
    sessionStorage.setItem('emergencyDismissed', 'true');
  };

  useEffect(() => {
    const raw = sessionStorage.getItem('sepsisResult');
    const dismissed = sessionStorage.getItem('emergencyDismissed');
    if (raw) {
      const d = JSON.parse(raw);
      setLastResult(d);
      cacheHealthCheck(d);
    }
    if (dismissed === 'true') {
      setEmergencyDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    const today = new Date().toDateString();
    Promise.all([
      getDocs(query(collection(db, 'predictions'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1))),
      getDocs(query(collection(db, 'medications'),  where('uid', '==', user.uid), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'symptoms'),     where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(3))),
    ]).then(([predSnap, medSnap, symSnap]) => {
      if (!predSnap.empty) { const d = predSnap.docs[0].data(); setLastResult(d); cacheHealthCheck(d); }
      const medsData = medSnap.docs.map((d) => { const m = { id: d.id, ...d.data() }; return { ...m, status: m.takenDate === today ? m.status : 'pending' }; });
      setTodayMeds(medsData);
      cacheMedications(medsData);
      setRecentSymptoms(symSnap.docs.map((d) => d.data()));
    }).catch((err) => {
      console.error('Failed to load home data:', err);
    }).finally(() => setLoadingData(false));
  }, [user]);

  const alertData = useMemo(() => ({
    uid: user?.uid, score: lastResult?.score, vitals: lastResult?.vitals,
    symptoms: recentSymptoms[0], medications: todayMeds, recentSymptoms,
  }), [user?.uid, lastResult?.score]); // eslint-disable-line
  const { alerts, emergencySituation } = useAlerts(alertData, !!user);
  useEffect(() => { 
    if (!emergencyDismissed) {
      setShowEmergency(emergencySituation);
    }
  }, [emergencySituation, emergencyDismissed]);

  const pendingMeds = todayMeds.filter((m) => m.status !== 'taken');
  const risk = RISK[lastResult?.riskLevel] || null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        
        <OfflineIndicator />
        <AlertsBanner alerts={alerts} />
        <EmergencyCard score={lastResult?.score} show={showEmergency} onDismiss={handleDismissEmergency} />

        {/* ── DESKTOP GRID LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          
          {/* LEFT COLUMN (2/3 on desktop) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* Hero */}
            <div className="card p-6 md:p-8 lg:p-10">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">Health Risk Monitor</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
                Check Your Health Risk Early
              </h1>
              <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
                Understand your condition and know what to do next. Track symptoms, get AI guidance, and stay informed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate('/check')} className="btn-primary btn btn-lg w-full sm:w-auto">
                  Start Check <ArrowRight size={18} strokeWidth={2} />
                </button>
                <button onClick={() => navigate('/assistant')} className="btn-secondary btn btn-lg w-full sm:w-auto">
                  <MessageCircle size={18} strokeWidth={1.75} /> Ask AI
                </button>
              </div>
            </div>

            {/* AI Recommendation */}
            {lastResult && (
              <AIRecommendationCard recommendation={lastResult.recommendation} score={lastResult.score} />
            )}

            {/* Quick Actions */}
            <div>
              <p className="section-label">Quick Actions</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Start Check',  desc: 'Check your risk',      icon: Activity,      to: '/check',       color: 'text-brand-500',   bg: 'bg-brand-50'   },
                  { label: 'Add Medicine', desc: 'Track medications',     icon: Pill,          to: '/medications', color: 'text-violet-500',  bg: 'bg-violet-50'  },
                  { label: 'Emergency',    desc: 'Find hospitals',        icon: MapPin,        to: '/emergency',   color: 'text-danger-500',  bg: 'bg-danger-50'  },
                  { label: 'Ask AI',       desc: 'Get guidance',          icon: MessageCircle, to: '/assistant',   color: 'text-success-600', bg: 'bg-success-50' },
                ].map((a) => (
                  <button key={a.to} onClick={() => navigate(a.to)}
                    className="card-hover p-4 md:p-5 lg:p-6 flex flex-col items-start gap-3 text-left h-full">
                    <div className={`w-10 h-10 md:w-12 md:h-12 ${a.bg} rounded-xl flex items-center justify-center`}>
                      <a.icon size={20} className={a.color} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-gray-900">{a.label}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptom Check-In */}
            {user && <SymptomsCheckIn onSubmit={() => {}} />}

            {/* Today's Medications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label mb-0">Today's Medications</p>
                <button onClick={() => navigate('/medications')}
                  className="text-xs md:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  Manage <ChevronRight size={14} />
                </button>
              </div>
              <div className="card overflow-hidden">
                {!user ? (
                  <div className="px-6 py-10 md:py-12 text-center">
                    <Pill size={32} className="text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                    <p className="text-base font-medium text-gray-600 mb-2">Sign in to track medications</p>
                    <p className="text-sm text-gray-400 mb-5">Keep track of your daily medicines</p>
                    <button onClick={() => navigate('/profile')} className="btn btn-secondary mx-auto">Sign In</button>
                  </div>
                ) : loadingData ? (
                  <div className="px-6 py-10 flex justify-center">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : todayMeds.length === 0 ? (
                  <div className="px-6 py-8 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-gray-700">No medications added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your daily medicines to track them</p>
                    </div>
                    <button onClick={() => navigate('/medications')} className="btn btn-secondary shrink-0">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ) : (
                  <div>
                    {pendingMeds.length > 0 && (
                      <div className="px-5 py-3 bg-warning-50 border-b border-warning-100 flex items-center gap-2">
                        <Bell size={14} className="text-warning-500 shrink-0" strokeWidth={2} />
                        <span className="text-sm font-semibold text-warning-700">
                          {pendingMeds.length} medication{pendingMeds.length > 1 ? 's' : ''} still to take
                        </span>
                      </div>
                    )}
                    <div className="divide-y divide-gray-100">
                      {todayMeds.slice(0, 4).map((m) => (
                        <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${m.status === 'taken' ? 'bg-success-50' : 'bg-gray-100'}`}>
                            {m.status === 'taken'
                              ? <CheckCircle size={18} className="text-success-600" strokeWidth={2} />
                              : <Clock size={18} className="text-gray-400" strokeWidth={1.75} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-medium ${m.status === 'taken' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.name}</p>
                            <p className="text-sm text-gray-400">{m.dosage} · {m.time}</p>
                          </div>
                          <span className={m.status === 'taken' ? 'badge-safe' : 'badge-medium'}>
                            {m.status === 'taken' ? 'Taken' : 'Pending'}
                          </span>
                        </div>
                      ))}
                      {todayMeds.length > 4 && (
                        <button onClick={() => navigate('/medications')}
                          className="w-full px-5 py-3 text-sm font-semibold text-brand-600 hover:bg-gray-50 text-left">
                          +{todayMeds.length - 4} more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (1/3 on desktop) */}
          <div className="space-y-4 md:space-y-6">
            
            {/* Current Status */}
            {lastResult && risk && (
              <div className={`card p-6 md:p-8 ${risk.bg}`}>
                <div className="flex flex-col items-center text-center gap-4">
                  <RiskMeter score={lastResult.score} riskLevel={lastResult.riskLevel} />
                  <div className="w-full">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <risk.Icon size={20} className={risk.color} strokeWidth={2} />
                      <p className={`text-xl font-bold ${risk.color}`}>{risk.label}</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {lastResult.riskLevel === 'high'
                        ? 'High risk detected. Please seek medical attention soon.'
                        : lastResult.riskLevel === 'moderate'
                        ? 'Some readings need attention. Monitor closely.'
                        : 'Your readings look normal. Keep monitoring regularly.'}
                    </p>
                    <button onClick={() => navigate('/result')}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">
                      View full result <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Card */}
            <div className="card p-6 md:p-8">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-danger-50 rounded-full flex items-center justify-center mx-auto">
                  <MapPin size={24} className="text-danger-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Emergency Help</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    If you feel very unwell, call emergency services or find a nearby hospital.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href="tel:112" className="btn-danger btn w-full justify-center">
                    Call 112
                  </a>
                  <button onClick={() => navigate('/emergency')} className="btn btn-secondary w-full justify-center">
                    <MapPin size={14} /> Find Hospital
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
