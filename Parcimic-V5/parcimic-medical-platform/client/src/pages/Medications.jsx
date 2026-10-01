import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Clock, Trash2, Bell, LogIn, X, AlarmClock, Calendar, Apple, Download, Copy, CheckCircle2, BellRing } from 'lucide-react';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  requestNotificationPermission,
  scheduleWebNotification,
  downloadICSFile,
  openGoogleCalendar,
  copyReminderToClipboard,
  isAppleDevice,
  getReminderInstructions,
  setupAllReminders,
} from '../utils/reminderIntegrations';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'As needed'];

function ReminderModal({ medication, onClose }) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const instructions = getReminderInstructions();

  useEffect(() => {
    setNotifEnabled(Notification?.permission === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result.granted) {
      scheduleWebNotification(medication);
      setNotifEnabled(true);
      toast.success('Browser notifications enabled!');
    } else {
      toast.error(result.error || 'Notifications denied');
    }
  };

  const handleDownloadICS = () => {
    downloadICSFile(medication);
    toast.success('Reminder file downloaded! Open it to add to your calendar.');
  };

  const handleGoogleCalendar = () => {
    openGoogleCalendar(medication);
    toast.success('Opening Google Calendar...');
  };

  const handleCopyText = async () => {
    try {
      await copyReminderToClipboard(medication);
      toast.success('Reminder details copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 animate-slide-up max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BellRing size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Setup Reminders</h2>
              <p className="text-xs text-gray-500 mt-0.5">Never miss a dose</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} strokeWidth={2} className="text-gray-400" />
          </button>
        </div>

        {/* Medication Info Card */}
        <div className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-5 mb-6 border border-brand-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Pill size={20} className="text-brand-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">{medication.name}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 flex-wrap">
                <span className="bg-white px-2 py-1 rounded-lg font-medium">{medication.dosage}</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                  <AlarmClock size={14} strokeWidth={2} />
                  <span className="font-medium">{medication.time}</span>
                </div>
                <span className="text-gray-300">·</span>
                <span className="bg-white px-2 py-1 rounded-lg font-medium">{medication.frequency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reminder Options */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Choose Reminder Method</p>

          {/* Browser Notifications */}
          <button
            onClick={handleEnableNotifications}
            disabled={notifEnabled}
            className={`group w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              notifEnabled
                ? 'bg-gradient-to-br from-success-50 to-green-50 border-success-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-brand-400 hover:shadow-md active:scale-[0.98]'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110 ${
              notifEnabled ? 'bg-gradient-to-br from-success-500 to-success-600' : 'bg-gradient-to-br from-brand-500 to-brand-600'
            }`}>
              {notifEnabled ? (
                <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
              ) : (
                <Bell size={28} className="text-white" strokeWidth={2.5} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">Browser Notifications</p>
              <p className="text-sm text-gray-600 mt-1">
                {notifEnabled ? '✓ Enabled - You\'ll get instant alerts' : 'Get instant reminders in your browser'}
              </p>
            </div>
          </button>

          {/* Apple Reminders / Calendar */}
          {isAppleDevice() ? (
            <button
              onClick={handleDownloadICS}
              className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 bg-white border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110">
                <Apple size={28} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">Add to Apple Reminders</p>
                <p className="text-sm text-gray-600 mt-1">Download .ics file for Reminders app</p>
              </div>
            </button>
          ) : (
            <button
              onClick={handleDownloadICS}
              className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 bg-white border-gray-200 hover:border-purple-400 hover:shadow-md transition-all text-left active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110">
                <Download size={28} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">Download Calendar File</p>
                <p className="text-sm text-gray-600 mt-1">Import to any calendar app (.ics)</p>
              </div>
            </button>
          )}

          {/* Google Calendar */}
          <button
            onClick={handleGoogleCalendar}
            className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 bg-white border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110">
              <Calendar size={28} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">Add to Google Calendar</p>
              <p className="text-sm text-gray-600 mt-1">Create a calendar event with reminder</p>
            </div>
          </button>

          {/* Copy Details */}
          <button
            onClick={handleCopyText}
            className="group w-full flex items-center gap-4 p-5 rounded-2xl border-2 bg-white border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110">
              <Copy size={28} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">Copy Details</p>
              <p className="text-sm text-gray-600 mt-1">Copy to clipboard for manual setup</p>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">📱</span>
            </div>
            <p className="text-sm font-bold text-blue-900">
              {instructions.platform} Instructions
            </p>
          </div>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            {instructions.steps.map((step, i) => (
              <li key={i} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>

        <button onClick={onClose} className="btn btn-secondary w-full mt-6 py-3 text-base font-semibold">
          Done
        </button>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', dosage: '', time: '08:00', frequency: 'Once daily' });
  const [saving, setSaving] = useState(false);
  const [setupReminders, setSetupReminders] = useState(true);
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.dosage.trim()) { toast.error('Please fill in name and dosage'); return; }
    setSaving(true);
    const newMed = await onAdd(form);
    
    // Setup reminders if enabled
    if (setupReminders && newMed) {
      const results = await setupAllReminders(newMed);
      if (results.webNotification) {
        toast.success('Browser notifications enabled!');
      }
      if (results.icsDownloaded) {
        toast.success('Reminder file downloaded! Open it to add to your calendar.');
      }
    }
    
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base font-semibold text-gray-900">Add Medication</h2>
          <button onClick={onClose} className="btn-ghost btn p-1.5 rounded-lg touch-target">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="label">Medication name</label>
            <input name="name" value={form.name} onChange={set} placeholder="e.g. Paracetamol" className="input" autoFocus />
          </div>
          <div>
            <label className="label">Dosage</label>
            <input name="dosage" value={form.dosage} onChange={set} placeholder="e.g. 500mg" className="input" />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
          
          {/* Reminder Setup Option */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={setupReminders}
                onChange={(e) => setSetupReminders(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Setup reminders automatically</p>
                <p className="text-xs text-gray-600 mt-1">
                  Enable browser notifications and download calendar reminder file
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="btn-primary btn flex-1">
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Plus size={14} strokeWidth={2.5} /> Add</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Medications() {
  const { user, signInWithGoogle } = useAuth();
  const [meds,    setMeds]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [reminderMed, setReminderMed] = useState(null);
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
      const newMed = { id: ref.id, ...form, status: 'pending', takenDate: null };
      setMeds((p) => [newMed, ...p]);
      toast.success(`${form.name} added`);
      return newMed; // Return the medication for reminder setup
    } catch { 
      toast.error('Could not add medication');
      return null;
    }
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
      <div className="w-full pb-24 lg:pb-8">
        <div className="max-w-sm mx-auto px-4 text-center py-12 md:py-16 space-y-4 animate-fade-in">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <Pill size={24} className="text-gray-400" strokeWidth={1.75} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Medication Reminders</h2>
          <p className="text-sm text-gray-500 leading-relaxed">Sign in to track your medications and never miss a dose.</p>
          <button onClick={signInWithGoogle} className="btn-primary btn mx-auto">
            <LogIn size={15} strokeWidth={2} /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 lg:pb-8">
      <div className="container-responsive py-4 md:py-6 lg:py-8">
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        {reminderMed && <ReminderModal medication={reminderMed} onClose={() => setReminderMed(null)} />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medications</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary btn w-full sm:w-auto">
            <Plus size={16} strokeWidth={2.5} /> Add Medication
          </button>
        </div>

        {/* DESKTOP: 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* LEFT: Main content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 md:gap-6">
              {[
                { label: 'Total',   value: meds.length,   icon: Pill,  color: 'text-brand-500',   bg: 'bg-brand-50'   },
                { label: 'Pending', value: pending.length, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
                { label: 'Taken',   value: taken.length,   icon: Check, color: 'text-success-600', bg: 'bg-success-50' },
              ].map((s) => (
                <div key={s.label} className="card p-4 md:p-6 text-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <s.icon size={20} className={s.color} strokeWidth={1.75} />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Pending alert */}
            {pending.length > 0 && taken.length > 0 && (
              <div className="rounded-xl px-5 py-4 bg-warning-50 border border-warning-100 flex items-center gap-3">
                <Bell size={18} className="text-warning-500 shrink-0" strokeWidth={2} />
                <p className="text-base text-warning-700 font-medium">
                  {pending.length} medication{pending.length > 1 ? 's' : ''} still to take today
                </p>
              </div>
            )}

            {loading ? (
              <div className="card p-16 flex justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : meds.length === 0 ? (
              <div className="card p-12 md:p-16 text-center">
                <Pill size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                <p className="text-lg font-semibold text-gray-700 mb-2">No medications added yet</p>
                <p className="text-sm text-gray-400 mb-6">Add your daily medications to track them here</p>
                <button onClick={() => setShowAdd(true)} className="btn-primary btn mx-auto">
                  <Plus size={16} strokeWidth={2.5} /> Add your first medication
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pending.length > 0 && (
                  <div>
                    <p className="section-label">Still to take</p>
                    <div className="card divide-y divide-gray-100 overflow-hidden">
                      {pending.map((m) => (
                        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-5">
                          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                            <Pill size={20} className="text-brand-500" strokeWidth={1.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-900">{m.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-sm text-gray-400">{m.dosage}</span>
                              <span className="text-gray-300">·</span>
                              <AlarmClock size={12} className="text-gray-400" strokeWidth={1.75} />
                              <span className="text-sm text-gray-400">{m.time}</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-sm text-gray-400">{m.frequency}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button onClick={() => setReminderMed(m)}
                              className="btn bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100 flex-1 sm:flex-initial"
                              title="Setup reminders">
                              <Bell size={14} strokeWidth={2} /> Remind
                            </button>
                            <button onClick={() => handleTake(m.id)}
                              className="btn bg-success-50 text-success-700 hover:bg-success-100 border border-success-100 flex-1 sm:flex-initial">
                              <Check size={14} strokeWidth={2.5} /> Taken
                            </button>
                            <button onClick={() => handleDelete(m.id)}
                              className="btn-ghost btn p-2 text-gray-300 hover:text-danger-500">
                              <Trash2 size={16} strokeWidth={1.75} />
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
                    <div className="card divide-y divide-gray-100 overflow-hidden">
                      {taken.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-5 opacity-60">
                          <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center shrink-0">
                            <Check size={20} className="text-success-600" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-500 line-through">{m.name}</p>
                            <p className="text-sm text-gray-400 mt-1">{m.dosage} · {m.time}</p>
                          </div>
                          <span className="badge-safe shrink-0">Done</span>
                          <button onClick={() => handleDelete(m.id)}
                            className="btn-ghost btn p-2 text-gray-300 hover:text-danger-500">
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT: Info sidebar (1/3) */}
          <div className="space-y-6">
            
            <div className="card p-6 md:p-8 bg-gradient-to-br from-brand-50 to-white border-2 border-brand-100">
              <div className="w-14 h-14 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BellRing size={24} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Smart Reminders</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
                Never miss a dose! Setup reminders with Apple Reminders, Google Calendar, or browser notifications.
              </p>
              <button onClick={() => setShowAdd(true)} className="btn-primary btn w-full justify-center shadow-md">
                <Plus size={16} /> Add Medication
              </button>
            </div>

            <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Bell size={18} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Reminder Options</p>
                  <p className="text-xs text-blue-700 mt-1">Multiple ways to stay on track</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Browser notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Apple Reminders sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Google Calendar events</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Universal .ics files</span>
                </li>
              </ul>
            </div>

            <div className="card p-5 bg-gradient-to-br from-green-50 to-white border border-green-100">
              <p className="text-sm text-green-800 leading-relaxed">
                <span className="font-semibold">💡 Pro Tip:</span> Click "Remind" on any medication to setup automatic reminders across all your devices!
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
