import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import HealthTimeline from '../components/HealthTimeline';
import { downloadReportTxt, copyReportToClipboard } from '../utils/pdfExport';
import toast from 'react-hot-toast';

export default function Timeline() {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    downloadReportTxt({ date: new Date().toLocaleDateString(), score: 45, riskLevel: 'moderate', vitals: {} });
    toast.success('Report downloaded');
  };

  const handleCopy = async () => {
    const ok = await copyReportToClipboard({ date: new Date().toLocaleDateString(), score: 45, riskLevel: 'moderate' });
    if (ok) { toast.success('Copied to clipboard'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Health Timeline</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">All your health events in one place</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={handleCopy}
              className={`btn btn-secondary flex-1 sm:flex-initial ${copied ? 'text-success-600' : ''}`}>
              {copied ? <><Check size={14} strokeWidth={2.5} /> Copied</> : <><Copy size={14} strokeWidth={2} /> Copy</>}
            </button>
            <button onClick={handleExport} className="btn btn-primary flex-1 sm:flex-initial">
              <Download size={14} strokeWidth={2} /> Export
            </button>
          </div>
        </div>

        <div className="card p-6 md:p-8 lg:p-10 mb-6">
          <HealthTimeline />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 md:p-6">
          <p className="text-sm md:text-base text-blue-800 leading-relaxed">
            <span className="font-semibold">Tip:</span> Regular tracking helps you see patterns in your health. Check in daily and take a full health check weekly.
          </p>
        </div>
      </div>
    </div>
  );
}
