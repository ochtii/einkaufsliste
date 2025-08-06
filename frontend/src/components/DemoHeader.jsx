import React from 'react';

export default function DemoHeader() {
  // Check if we're in demo mode
  const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                    (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

  if (!isDemoMode) return null;

  const lastUpdated = window.DEMO_CONFIG?.lastUpdated || '2025-08-06 15:30:00 CET';
  const buildTime = window.DEMO_CONFIG?.buildTimestamp ? new Date(window.DEMO_CONFIG.buildTimestamp) : new Date();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm py-2 px-4 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-semibold flex items-center">
            🎮 <span className="ml-2">DEMO-MODUS</span>
          </span>
          <span className="text-blue-100">
            Letzte Aktualisierung: {lastUpdated}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="text-blue-100">
            Build: {buildTime.toLocaleString('de-DE')}
          </span>
          <span className="bg-blue-700 px-2 py-1 rounded">
            Demo-Version
          </span>
        </div>
      </div>
    </div>
  );
}
