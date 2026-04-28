import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Activity, Clock, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDocs(query(collection(db, 'predictions'), where('uid', '==', user.uid)))
      .then((snap) => {
        const docs = snap.docs.map((d) => d.data());
        setStats({
          total: docs.length,
          high: docs.filter((d) => d.riskLevel === 'high').length,
          avg: docs.length ? Math.round(docs.reduce((a, d) => a + d.score, 0) / docs.length) : 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSignOut = async () => {
    try { await signOut(); toast.success('Signed out'); navigate('/'); }
    catch { toast.error('Sign out failed'); }
  };

  // ── Not signed in ──
  if (!user) {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Sign in to save your health history</p>
        </div>

        <div className="card-md p-8 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User size={28} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Sign in to your account</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-6">
            Save your health checks, track your risk over time, and get personalised guidance.
          </p>
          <button onClick={signInWithGoogle} className="btn-primary btn w-full justify-center py-3">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-neutral-400 mt-4">
            You can still use all features without signing in.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-neutral-900 text-sm mb-3">What you get with an account</h3>
          <ul className="space-y-2.5">
            {[
              'Save your health checks automatically',
              'Track your risk score over time',
              'Access your history from any device',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-600">
                <CheckCircle size={14} className="text-green-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Signed in ──
  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your account and health summary</p>
      </div>

      {/* User card */}
      <div className="card-md p-6 flex items-center gap-4">
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="w-14 h-14 rounded-2xl" />
          : <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">{initial}</div>
        }
        <div>
          <h2 className="font-bold text-neutral-900">{user.displayName || 'User'}</h2>
          <p className="text-sm text-neutral-400">{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-neutral-400">Account active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="card p-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total checks', value: stats.total, icon: Activity, color: 'text-brand-500 bg-brand-50' },
            { label: 'High risk', value: stats.high, icon: User, color: 'text-red-500 bg-red-50' },
            { label: 'Avg score', value: stats.avg || '—', icon: Clock, color: 'text-amber-500 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className={`w-8 h-8 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={14} />
              </div>
              <div className="text-xl font-bold text-neutral-900">{s.value}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="card divide-y divide-neutral-100">
        {[
          { label: 'Start a health check', icon: Activity, to: '/check' },
          { label: 'View my history',      icon: Clock,    to: '/history' },
        ].map((item) => (
          <button key={item.to} onClick={() => navigate(item.to)}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left">
            <item.icon size={15} className="text-neutral-400" />
            {item.label}
            <span className="ml-auto text-neutral-300">›</span>
          </button>
        ))}
      </div>

      <button onClick={handleSignOut} className="btn-secondary btn w-full justify-center py-3 text-red-700 border-red-100 hover:bg-red-50">
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );
}
