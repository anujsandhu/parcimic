import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Heart, Thermometer, Wind, Activity,
  FlaskConical, CheckCircle, ArrowRight, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { predictSepsis } from '../utils/api';

function calcLocalScore(f) {
  let s = 0;
  const hr = +f.heartRate||0, tmp = +f.temp||0, rr = +f.respRate||0;
  const sbp = +f.sysBP||0, o2 = +f.o2Sat||0, lac = +f.lactate||0;
  const wbc = +f.wbc||0, age = +f.age||0;
  if (hr > 100 || hr < 60)  s += 15;
  if (tmp > 38.3 || tmp < 36) s += 15;
  if (rr > 22)               s += 20;
  if (sbp < 100)             s += 25;
  if (o2 < 94)               s += 15;
  if (lac > 2.0)             s += 30;
  if (wbc > 12 || (wbc > 0 && wbc < 4)) s += 15;
  if (age > 65)              s += 10;
  if (f.recentSurgery)       s += 20;
  if (f.chronicDisease)      s += 15;
  if (f.shortnessBreath || f.difficultyBreathing) s += 20;
  if (f.abdominalPain)       s += 15;
  if (f.fever)               s += 10;
  if (f.confusion)           s += 15;
  if (f.fatigue)             s += 8;
  return Math.min(Math.round(s * 0.72), 99);
}

const STEPS = [
  { id: 'basics',   label: 'About You',   icon: User },
  { id: 'vitals',   label: 'Vitals',      icon: Heart },
  { id: 'symptoms', label: 'Symptoms',    icon: Activity },
  { id: 'labs',     label: 'Lab Results', icon: FlaskConical },
];

const defaultForm = {
  age: '', recentSurgery: false, chronicDisease: false,
  heartRate: '', temp: '', respRate: '', sysBP: '', o2Sat: '',
  shortnessBreath: false, difficultyBreathing: false,
  abdominalPain: false, fever: false, confusion: false, fatigue: false,
  wbc: '', lactate: '', creatinine: '', platelets: '',
};

// ─── Checkbox card ────────────────────────────────────────────────────────────
function CheckCard({ name, label, sub, checked, onChange }) {
  return (
    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-150 ${
      checked ? 'border-brand-400 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange}
        className="w-4 h-4 accent-brand-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </label>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function StepBasics({ form, set }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about yourself</h2>
        <p className="text-sm text-gray-500">This helps us give you a more accurate result.</p>
      </div>
      <div>
        <label className="label">Your age</label>
        <input type="number" name="age" value={form.age} onChange={set}
          placeholder="e.g. 45" min="1" max="120" className="input max-w-xs" />
      </div>
      <div className="space-y-2">
        <p className="label">Any of these apply to you?</p>
        <CheckCard name="recentSurgery" label="Had surgery in the last 30 days" sub="Any type of surgical procedure" checked={form.recentSurgery} onChange={set} />
        <CheckCard name="chronicDisease" label="Have a long-term health condition" sub="e.g. diabetes, heart disease, COPD" checked={form.chronicDisease} onChange={set} />
      </div>
    </div>
  );
}

function StepVitals({ form, set }) {
  const fields = [
    { name: 'heartRate', label: 'Heart rate',       unit: 'bpm',  placeholder: '72',   hint: 'Normal: 60–100 bpm',    icon: Heart,       min: 30,  max: 250 },
    { name: 'temp',      label: 'Body temperature', unit: '°C',   placeholder: '37.0', hint: 'Normal: 36.1–37.2 °C',  icon: Thermometer, step: '0.1', min: 30, max: 45 },
    { name: 'respRate',  label: 'Breathing rate',   unit: '/min', placeholder: '16',   hint: 'Normal: 12–20 per min', icon: Wind,        min: 5,   max: 60 },
    { name: 'sysBP',     label: 'Blood pressure',   unit: 'mmHg', placeholder: '120',  hint: 'Systolic (top number)', icon: Activity,    min: 50,  max: 250 },
    { name: 'o2Sat',     label: 'Oxygen level',     unit: '%',    placeholder: '98',   hint: 'Normal: 95–100%',       icon: Activity,    min: 50,  max: 100 },
  ];
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your vital signs</h2>
        <p className="text-sm text-gray-500">Enter what you know. Skip anything you don't have.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className="card p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <f.icon size={15} className="text-brand-500" strokeWidth={1.75} />
              <label className="text-sm font-semibold text-gray-700">{f.label}</label>
            </div>
            <div className="relative">
              <input type="number" name={f.name} value={form[f.name]} onChange={set}
                placeholder={f.placeholder} step={f.step || '1'} min={f.min} max={f.max}
                className="input pr-14" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none font-medium">{f.unit}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{f.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSymptoms({ form, set }) {
  const symptoms = [
    { name: 'fever',               label: 'Fever or chills',             sub: 'Feeling unusually hot or cold' },
    { name: 'shortnessBreath',     label: 'Shortness of breath',         sub: 'Difficulty breathing normally' },
    { name: 'difficultyBreathing', label: 'Laboured breathing',          sub: 'Breathing feels like hard work' },
    { name: 'confusion',           label: 'Confusion or disorientation', sub: 'Feeling mentally foggy' },
    { name: 'abdominalPain',       label: 'Stomach pain',                sub: 'Unusual pain in your abdomen' },
    { name: 'fatigue',             label: 'Extreme tiredness',           sub: 'Much more tired than usual' },
  ];
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">How are you feeling?</h2>
        <p className="text-sm text-gray-500">Select everything that applies to you right now.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {symptoms.map((s) => (
          <CheckCard key={s.name} name={s.name} label={s.label} sub={s.sub} checked={form[s.name]} onChange={set} />
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">Not sure? Leave it unchecked — that's fine.</p>
    </div>
  );
}

function StepLabs({ form, set }) {
  const fields = [
    { name: 'wbc',        label: 'White blood cell count', unit: '×10³/µL', placeholder: '8.5',  step: '0.1' },
    { name: 'lactate',    label: 'Lactate level',          unit: 'mmol/L',  placeholder: '1.2',  step: '0.1' },
    { name: 'creatinine', label: 'Creatinine',             unit: 'mg/dL',   placeholder: '1.0',  step: '0.1' },
    { name: 'platelets',  label: 'Platelet count',         unit: '×10³/µL', placeholder: '250' },
  ];
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Lab results</h2>
        <p className="text-sm text-gray-500">Only fill this in if you have recent blood test results. Completely optional.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}</label>
            <div className="relative">
              <input type="number" name={f.name} value={form[f.name]} onChange={set}
                placeholder={f.placeholder} step={f.step || '1'} className="input pr-20" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <p className="text-xs text-gray-500 leading-relaxed">
          Don't have lab results? No problem — skip this step and we'll still give you a useful result based on your vitals and symptoms.
        </p>
      </div>
    </div>
  );
}

export default function HealthCheck() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      vitals:   { heartRate: +form.heartRate||80, temp: +form.temp||37, respRate: +form.respRate||16, sysBP: +form.sysBP||120, o2Sat: +form.o2Sat||98 },
      labs:     { wbc: +form.wbc||null, lactate: +form.lactate||null, creatinine: +form.creatinine||null, platelets: +form.platelets||null },
      history:  { age: +form.age||45, recentSurgery: form.recentSurgery, chronicDisease: form.chronicDisease },
      symptoms: { shortnessBreath: form.shortnessBreath, difficultyBreathing: form.difficultyBreathing, abdominalPain: form.abdominalPain, fever: form.fever, confusion: form.confusion, fatigue: form.fatigue },
    };
    try {
      let data;
      try { data = await predictSepsis(payload); }
      catch {
        const score = calcLocalScore(form);
        data = { score, riskLevel: score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low', recommendation: null, isLocal: true };
      }
      sessionStorage.setItem('sepsisResult', JSON.stringify({ ...data, form }));
      navigate('/result');
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const steps = [
    <StepBasics   form={form} set={set} />,
    <StepVitals   form={form} set={set} />,
    <StepSymptoms form={form} set={set} />,
    <StepLabs     form={form} set={set} />,
  ];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">

      {/* Progress */}
      <div>
        <div className="flex items-center mb-3">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`step-dot ${i < step ? 'step-dot-done' : i === step ? 'step-dot-active' : 'step-dot-inactive'}`}>
                  {i < step ? <CheckCircle size={15} strokeWidth={2.5} /> : <span>{i + 1}</span>}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-brand-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${i < step ? 'bg-success-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="card p-6 sm:p-8">{steps[step]}</div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn btn-secondary flex-1">
            <ArrowLeft size={15} strokeWidth={2} /> Back
          </button>
        )}
        {isLast ? (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary btn flex-1">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking...</>
              : <>Get My Result <ArrowRight size={15} strokeWidth={2.5} /></>
            }
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} className="btn-primary btn flex-1">
            Continue <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">Your data is not stored unless you sign in.</p>
    </div>
  );
}
