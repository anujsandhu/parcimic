import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Check, Clock, Trash2, Bell, LogIn, X, AlarmClock } from 'lucide-react';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'As needed'];

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', dosage: '', time: '08:00', frequency: 'Once daily' });
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.dosage.trim()) { toast.error('Please fill in name and dosage'); return; }
    setSaving(true);
    await onAdd(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Add Medication</h2>
          <button onClick={onClose} className="btn-ghost btn p-1.5 rounded-lg"><X size={16} strokeWidth={2} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Medication name</label>
            <input name="name" value={form.name} onChange={set} placeholder="e.g. Paracetamol" className="input" />
          </div>
          <div>
            <label className="label">Dosage</label>
            <input name="dosage" value={form.dosage} onChange={set} placeholder="e.g. 500mg" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Time</label>
              <input type="time" name="time" value={form.time} onChange={set} className="input" />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select name="frequency" value={form.frequency} onChange={set} className="input">
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary btn flex-1">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={14} strokeWidth={2.5} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Medications() {
  const { user, signInWithGoogle } = useAuth();
  const [meds,     setMeds]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const today = new Date().toDateString();

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'medications'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMeds(snap.docs.map((d) => {
        const m = { id: d.id, ...d.data() };
        return { ...m, status: m.takenDate === today ? m.status : 'pending' };
      }));
    } catch (err) { console.error(err); toast.error('Could not load medications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const handleAdd = async (form) => {
    try {
      const ref = await addDoc(collection(db, 'medications'), {
        uid: user.uid, name: form.name, dosage: form.dosage,
        time: form.time, frequency: form.frequency,
        status: 'pending', takenDate: null, createdAt: serverTimestamp(),
      });
      setMeds((p) => [{ id: ref.id, ...form, status: 'pending', takenDate: null }, ...p]);
      toast.success(`${form.name} added`);
    } catch { toast.error('Could not add medication'); }
  };

  const handleTake = async (id) => {
    try {
      await updateDoc(doc(db, 'medications', id), { status: 'taken', takenDate: today });
      setMeds((p) => p.map((m) => m.id === id ? { ...m, status: 'taken', takenDate: today } : m));
      toast.success('Marked as taken');
    } catch { toast.error('Could not update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medication?')) return;
    try {
      await deleteDoc(doc(db, 'medications', id));
      setMeds((p) => p.filter((m) => m.id !== id));
      toast.success('Removed');
    } catch { toast.error('Could not remove'); }
  };

  const pending = meds.filter((m) => m.status !== 'taken');
  const taken   = meds.filter((m) => m.status === 'taken');

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4 animate-fade-in">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
          <Pill size={24} className="text-gray-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Medication Reminders</h2>
        <p className="text-sm text-gray-500 leading-relaxed">Sign in to track your medications and get daily reminders.</p>
        <button onClick={signInWithGoogle} className="btn-primary btn mx-auto">
          <LogIn size={15} strokeWidth={2} /> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn btn-sm">
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: meds.length,   icon: Pill,  cls: 'text-brand-500 bg-brand-50'   },
          { label: 'Pending', value: pending.length, icon: Clock, cls: 'text-warning-600 bg-warning-50' },
          { label: 'Taken',   value: taken.length,   icon: Check, cls: 'text-success-600 bg-success-50' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`w-8 h-8 ${s.cls} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <s.icon size={15} strokeWidth={1.75} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Missed alert */}
      {pending.length > 0 && taken.length > 0 && (
        <div className="rounded-lg px-4 py-3 bg-warning-50 border border-warning-200 flex items-center gap-2">
          <Bell size={15} className="text-warning-500 shrink-0" strokeWidth={2} />
          <p className="text-sm text-warning-700 font-medium">
            {pending.length} medication{pending.length > 1 ? 's' : ''} still to take today
          </p>
        </div>
      )}

      {loading ? (
        <div className="card p-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : meds.length === 0 ? (
        <div className="card p-10 text-center">
          <Pill size={32} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
          <p className="font-semibold text-gray-700 mb-1">No medications added yet</p>
          <p className="text-xs text-gray-400 mb-5">Add your daily medications to track them here</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary btn btn-sm mx-auto">
            <Plus size={13} strokeWidth={2.5} /> Add your first medication
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.length > 0 && (
            <div>
              <p className="section-label">Still to take</p>
              <div className="card divide-y divide-gray-100">
                {pending.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <Pill size={16} className="text-brand-500" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{m.dosage}</span>
                        <span className="text-gray-200">·</span>
                        <AlarmClock size={11} className="text-gray-400" strokeWidth={1.75} />
                        <span className="text-xs text-gray-400">{m.time}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{m.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleTake(m.id)}
                        className="btn btn-sm bg-success-50 text-success-700 hover:bg-success-100 border border-success-200 px-3 py-1.5">
                        <Check size={12} strokeWidth={2.5} /> Taken
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="btn-ghost btn p-1.5 text-gray-300 hover:text-danger-500">
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taken.length > 0 && (
            <div>
              <p className="section-label">Taken today</p>
              <div className="card divide-y divide-gray-100">
                {taken.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-4 opacity-60">
                    <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center shrink-0">
                      <Check size={16} className="text-success-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 line-through">{m.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.dosage} · {m.time}</p>
                    </div>
                    <span className="badge-safe text-2xs shrink-0">Done</span>
                    <button onClick={() => handleDelete(m.id)}
                      className="btn-ghost btn p-1.5 text-gray-300 hover:text-danger-500">
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
