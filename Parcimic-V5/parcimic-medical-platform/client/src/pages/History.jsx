import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Trash2, LogIn } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

function RiskIcon({ level }) {
  if (level === 'high')   return <AlertCircle size={14} className="text-red-500" />;
  if (level === 'medium') return <AlertTriangle size={14} className="text-amber-500" />;
  return <CheckCircle size={14} className="text-green-600" />;
}

function RiskBadge({ level }) {
  if (level === 'high')   return <span className="badge-high">Needs Care</span>;
  if (level === 'medium') return <span className="badge-medium">Needs Attention</span>;
  return <span className="badge-safe">Doing Fine</span>;
}

export default function History() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'predictions'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Could not load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [user]); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this record?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'predictions', id));
      setRecords((p) => p.filter((r) => r.id !== id));
      toast.success('Record removed');
    } catch { toast.error('Could not delete'); }
    finally { setDeleting(null); }
  };

  const chartData = [...records].reverse().slice(-15).map((r, i) => ({
    i: i + 1,
    score: r.score,
    date: r.createdAt?.toDate
      ? r.createdAt.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : `#${i + 1}`,
  }));

  // Not signed in
  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4 animate-fade-in">
        <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto">
          <Clock size={24} className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Your check history</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Sign in to save your health checks and track your risk level over time.
        </p>
        <button onClick={signInWithGoogle} className="btn-primary btn mx-auto">
          <LogIn size={15} /> Sign in with Google
        </button>
        <p className="text-xs text-neutral-400">Free · No spam · Your data stays private</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Your History</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Track how your health changes over time</p>
        </div>
        <button onClick={fetch} className="btn-ghost btn btn-sm">Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total checks', value: records.length, icon: Clock, color: 'text-brand-500 bg-brand-50' },
          { label: 'High risk', value: records.filter((r) => r.riskLevel === 'high').length, icon: AlertCircle, color: 'text-red-500 bg-red-50' },
          { label: 'Average score', value: records.length ? Math.round(records.reduce((a, r) => a + r.score, 0) / records.length) : '—', icon: TrendingUp, color: 'text-amber-500 bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon size={16} />
            </div>
            <div className="text-2xl font-bold text-neutral-900">{s.value}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <h2 className="font-semibold text-neutral-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-500" /> Risk score trend
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #E5E7EB' }} formatter={(v) => [v + '/100', 'Score']} />
              <ReferenceLine y={65} stroke="#EF4444" strokeDasharray="4 4" />
              <ReferenceLine y={35} stroke="#F59E0B" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900 text-sm">All checks</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <Clock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No checks yet</p>
            <p className="text-xs mt-1">Complete a health check to see it here</p>
            <button onClick={() => navigate('/check')} className="btn-primary btn btn-sm mt-4 mx-auto">
              Start a check
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {records.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100">
                  <RiskIcon level={r.riskLevel} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-lg font-bold ${r.score >= 65 ? 'text-red-500' : r.score >= 35 ? 'text-amber-500' : 'text-green-600'}`}>
                      {r.score}
                    </span>
                    <span className="text-xs text-neutral-400">/ 100</span>
                    <RiskBadge level={r.riskLevel} />
                  </div>
                  <div className="text-xs text-neutral-400">
                    {r.createdAt?.toDate
                      ? r.createdAt.toDate().toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Unknown date'}
                  </div>
                </div>
                <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                  className="btn-ghost btn p-2 text-neutral-300 hover:text-red-500">
                  {deleting === r.id
                    ? <div className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
