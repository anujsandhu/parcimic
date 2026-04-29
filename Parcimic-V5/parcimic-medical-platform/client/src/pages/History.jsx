import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Trash2, LogIn, RefreshCw } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

function RiskIcon({ level }) {
  if (level === 'high')   return <AlertCircle size={14} className="text-danger-500" strokeWidth={2} />;
  if (level === 'medium') return <AlertTriangle size={14} className="text-warning-500" strokeWidth={2} />;
  return <CheckCircle size={14} className="text-success-600" strokeWidth={2} />;
}

function RiskBadge({ level }) {
  if (level === 'high')   return <span className="badge-high">Needs Care</span>;
  if (level === 'medium') return <span className="badge-medium">Attention</span>;
  return <span className="badge-safe">Doing Fine</span>;
}

export default function History() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadRecords = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'predictions'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); toast.error('Could not load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRecords(); }, [user]); // eslint-disable-line

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

  if (!user) {
    return (
      <div className="max-w-sm mx-auto text-center py-16 space-y-4 animate-fade-in">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
          <Clock size={22} className="text-gray-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Your check history</h2>
        <p className="text-sm text-gray-500 leading-relaxed">Sign in to save your health checks and track your risk level over time.</p>
        <button onClick={signInWithGoogle} className="btn-primary btn mx-auto">
          <LogIn size={15} strokeWidth={2} /> Sign in with Google
        </button>
        <p className="text-xs text-gray-400">Free · No spam · Your data stays private</p>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track how your health changes over time</p>
        </div>
        <button onClick={loadRecords} disabled={loading} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total checks',  value: records.length, icon: Clock,       color: 'text-brand-500',  bg: 'bg-brand-50'  },
          { label: 'High risk',     value: records.filter((r) => r.riskLevel === 'high').length, icon: AlertCircle, color: 'text-danger-500', bg: 'bg-danger-50' },
          { label: 'Average score', value: records.length ? Math.round(records.reduce((a, r) => a + r.score, 0) / records.length) : '—', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <s.icon size={14} className={s.color} strokeWidth={1.75} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-500" strokeWidth={2} /> Risk score trend
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E5E7EB' }} formatter={(v) => [v + '/100', 'Score']} />
              <ReferenceLine y={65} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={35} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2}
                dot={{ r: 3, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">All checks</p>
          {records.length > 0 && <span className="text-xs text-gray-400">{records.length} records</span>}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock size={28} className="mx-auto mb-3 opacity-40" strokeWidth={1.75} />
            <p className="text-sm font-medium text-gray-600">No checks yet</p>
            <p className="text-xs mt-1 mb-4">Complete a health check to see it here</p>
            <button onClick={() => navigate('/check')} className="btn-primary btn btn-sm mx-auto">Start a check</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100">
                  <RiskIcon level={r.riskLevel} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-lg font-bold leading-none ${r.score >= 65 ? 'text-danger-500' : r.score >= 35 ? 'text-warning-500' : 'text-success-600'}`}>
                      {r.score}
                    </span>
                    <span className="text-xs text-gray-400">/ 100</span>
                    <RiskBadge level={r.riskLevel} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {r.createdAt?.toDate
                      ? r.createdAt.toDate().toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Unknown date'}
                  </p>
                </div>
                <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                  className="btn-ghost btn p-1.5 text-gray-300 hover:text-danger-500">
                  {deleting === r.id
                    ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    : <Trash2 size={13} strokeWidth={1.75} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
