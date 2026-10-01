import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src="/assets/logos/parcimic-logo.png"
          alt="Parcimic"
          className="h-16 w-auto object-contain animate-pulse"
        />
        
        {/* Loading spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-sm font-medium text-gray-600 animate-pulse">Loading Parcimic...</p>
      </div>
    </div>
  );
}
