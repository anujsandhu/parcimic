import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Clock, CheckCircle, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Google icon
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Profile() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDocs(query(collection(db, 'predictions'), where('uid', '==', user.uid)))
      .then((snap) => {
        const docs = snap.docs.map((d) => d.data());
        setStats({
          total: docs.length,
          high:  docs.filter((d) => d.riskLevel === 'high').length,
          avg:   docs.length ? Math.round(docs.reduce((a, d) => a + d.score, 0) / docs.length) : 0,
        });
      })
      .catch((err) => {
        console.error('Failed to load profile stats:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSignOut = async () => {
    try { await signOut(); toast.success('Signed out'); navigate('/'); }
    catch { toast.error('Sign out failed'); }
  };

  // ── Sign-in page ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fade-in">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/assets/logos/parcimic-logo.png"
              alt="Parcimic"
              className="h-10 w-auto mx-auto mb-4 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Parcimic</h1>
            <p className="text-sm text-gray-500 mt-1.5">Your personal health assistant</p>
          </div>

          {/* Card */}
          <div className="card p-6 shadow-md">
            <button
              onClick={signInWithGoogle}
              className="btn btn-secondary w-full justify-center py-3 gap-3 hover:bg-gray-50 mb-4">
              <GoogleIcon />
              <span className="font-semibold">Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Email</label>
                <input type="email" placeholder="you@example.com" className="input" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" placeholder="••••••••" className="input" />
              </div>
              <button className="btn-primary btn w-full justify-center py-2.5 mt-1">
                Sign In
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button className="text-xs text-brand-600 hover:text-brand-700 font-medium">Forgot password?</button>
              <button className="text-xs text-brand-600 hover:text-brand-700 font-medium">Create account</button>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-2.5">
            {[
              'Save your health checks automatically',
              'Track your risk score over time',
              'Access your history from any device',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-500">
                <CheckCircle size={14} className="text-success-500 shrink-0" strokeWidth={2} />
                {item}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            You can still use all features without signing in.
          </p>
        </div>
      </div>
    );
  }

  // ── Signed-in profile ─────────────────────────────────────────────────────
  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* LEFT: Main profile */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* User card */}
            <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-20 h-20 rounded-full" />
                : <div className="w-20 h-20 bg-brand-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">{initial}</div>
              }
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xl font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
                <p className="text-base text-gray-400 truncate mt-1">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full" />
                  <span className="text-sm text-gray-400">Active</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            {loading ? (
              <div className="card p-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats && (
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: 'Checks',    value: stats.total,      icon: Activity,    color: 'text-brand-500',  bg: 'bg-brand-50'  },
                  { label: 'High risk', value: stats.high,       icon: AlertCircle, color: 'text-danger-500', bg: 'bg-danger-50' },
                  { label: 'Avg score', value: stats.avg || '—', icon: TrendingUp,  color: 'text-amber-500',  bg: 'bg-amber-50'  },
                ].map((s) => (
                  <div key={s.label} className="card p-5 md:p-6 text-center">
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <s.icon size={20} className={s.color} strokeWidth={1.75} />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="card divide-y divide-gray-100 overflow-hidden">
              {[
                { label: 'Start a health check', icon: Activity, to: '/check',   sub: 'Check your risk now' },
                { label: 'View my history',      icon: Clock,    to: '/history', sub: 'Past health checks'  },
              ].map((item) => (
                <button key={item.to} onClick={() => navigate(item.to)}
                  className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-gray-500" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>

          </div>

          {/* RIGHT: Actions */}
          <div className="space-y-6">
            
            <div className="card p-6 md:p-8 text-center">
              <div className="w-14 h-14 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-danger-500" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-sm text-gray-500 mb-5">
                You'll need to sign in again to access your data.
              </p>
              <button onClick={handleSignOut}
                className="btn btn-secondary w-full justify-center text-danger-600 border-danger-100 hover:bg-danger-50">
                <LogOut size={16} strokeWidth={1.75} /> Sign Out
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
