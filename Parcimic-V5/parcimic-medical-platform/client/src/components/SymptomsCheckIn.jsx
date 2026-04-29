import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function SymptomsCheckIn({ onSubmit = null }) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [lastEntry, setLastEntry] = useState(null);
  const [form, setForm] = useState({ fever: false, fatigue: 0, cough: 0, breathing: 0, notes: '' });

  // Only load once on mount — use a ref to prevent re-runs
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (!auth.currentUser) return;
    getDocs(query(
      collection(db, 'symptoms'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    )).then((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setLastEntry({ ...d, date: d.createdAt?.toDate?.() || new Date() });
      }
    }).catch((err) => {
      console.error('Failed to load last symptom entry:', err);
    });
  }, []);

  const handleSubmit = async () => {
    if (!auth.currentUser) { toast.error('Please sign in first'); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'symptoms'), {
        uid: auth.currentUser.uid, ...form,
        createdAt: new Date(),
        date: new Date().toLocaleDateString('en-CA'),
      });
      await axios.post('/api/symptoms/checkin', { uid: auth.currentUser.uid, ...form }).catch(() => {});
      toast.success('Check-in saved');
      setForm({ fever: false, fatigue: 0, cough: 0, breathing: 0, notes: '' });
      setIsOpen(false);
      setLastEntry({ ...form, date: new Date() });
      if (onSubmit) onSubmit();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save check-in');
    } finally { setLoading(false); }
  };

  const isToday = lastEntry && new Date(lastEntry.date).toDateString() === new Date().toDateString();

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
            <Activity size={15} className="text-brand-500" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Daily Symptom Check-In</p>
            <p className="text-xs text-gray-400">
              {isToday ? 'Checked in today' : 'Tap to log how you feel'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isToday && <span className="badge-safe">Done</span>}
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          {/* Fever */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              form.fever ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
            }`}>
              {form.fever && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <input type="checkbox" checked={form.fever}
              onChange={(e) => setForm((p) => ({ ...p, fever: e.target.checked }))} className="sr-only" />
            <span className="text-sm font-medium text-gray-800">Fever or chills</span>
          </label>

          {/* Sliders */}
          {[
            { key: 'fatigue',   label: 'Fatigue level'         },
            { key: 'cough',     label: 'Cough intensity'       },
            { key: 'breathing', label: 'Breathing difficulty'  },
          ].map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">{s.label}</label>
                <span className="text-xs font-semibold text-gray-500">{form[s.key]}/10</span>
              </div>
              <input type="range" min="0" max="10" value={form[s.key]}
                onChange={(e) => setForm((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                className="w-full h-1.5 accent-brand-500 cursor-pointer" />
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any other symptoms..."
              className="input resize-none" rows={2} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary btn flex-1">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Check-In'
              }
            </button>
            <button onClick={() => setIsOpen(false)} disabled={loading} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
