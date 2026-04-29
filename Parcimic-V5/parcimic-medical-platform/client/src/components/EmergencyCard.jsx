import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Phone, X } from 'lucide-react';

// Simple modal — no location fetching here (that's on the Emergency page)
export default function EmergencyCard({ score = null, show = false, onDismiss = null }) {
  const navigate = useNavigate();

  if (!show || !score || score < 65) return null;

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl animate-fade-in-up">
        {/* Header */}
        <div className="bg-danger-500 text-white px-5 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} strokeWidth={2} />
              <h2 className="text-base font-bold">Seek Medical Attention</h2>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <p className="text-sm text-red-100 mt-1">
            Your risk score is {score}/100. Please seek help immediately.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Emergency Numbers</p>
            <div className="space-y-2">
              {[
                { name: 'Emergency', number: '112', primary: true  },
                { name: 'Ambulance', number: '108', primary: false },
              ].map((n) => (
                <a key={n.number} href={`tel:${n.number}`}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition ${
                    n.primary
                      ? 'bg-danger-50 border-danger-100 hover:bg-danger-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className={n.primary ? 'text-danger-500' : 'text-gray-500'} strokeWidth={2} />
                    <span className="text-sm font-medium text-gray-800">{n.name}</span>
                  </div>
                  <span className={`text-lg font-bold ${n.primary ? 'text-danger-600' : 'text-gray-700'}`}>{n.number}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => navigate('/emergency')}
              className="btn-primary btn flex-1 justify-center">
              <MapPin size={14} strokeWidth={2} /> Find Hospital
            </button>
            <button onClick={handleDismiss}
              className="btn btn-secondary flex-1 justify-center text-xs">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
