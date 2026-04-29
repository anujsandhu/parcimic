import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAlertActionUrl } from '../utils/alertsService';

const SEVERITY_STYLES = {
  high:     { bg: 'bg-danger-50 border-danger-100',  text: 'text-danger-800',  Icon: AlertCircle  },
  moderate: { bg: 'bg-warning-50 border-warning-100', text: 'text-warning-800', Icon: AlertTriangle },
  low:      { bg: 'bg-blue-50 border-blue-100',       text: 'text-blue-800',    Icon: Info          },
};

export default function AlertsBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState({});
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) return null;

  const visible = alerts.filter((a) => !dismissed[a.type]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert, i) => {
        const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
        const Icon = s.Icon;
        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${s.bg}`}>
            <Icon size={15} className={`${s.text} shrink-0 mt-0.5`} strokeWidth={2} />
            <p className={`text-sm font-medium flex-1 ${s.text}`}>{alert.message}</p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(getAlertActionUrl(alert))}
                className={`text-xs font-semibold underline ${s.text}`}>
                View
              </button>
              <button
                onClick={() => setDismissed((p) => ({ ...p, [alert.type]: true }))}
                className="text-gray-400 hover:text-gray-600">
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
