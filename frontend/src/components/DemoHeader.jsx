import { useState, useEffect } from 'react';

export default function DemoHeader() {
  const [demoConfig, setDemoConfig] = useState(null);
  
  // Check if we're in demo mode
  const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                    (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

  useEffect(() => {
    if (isDemoMode) {
      // Poll for DEMO_CONFIG to be available
      const checkConfig = () => {
        if (window.DEMO_CONFIG) {
          setDemoConfig(window.DEMO_CONFIG);
          return true;
        }
        return false;
      };
      
      if (!checkConfig()) {
        const interval = setInterval(() => {
          if (checkConfig()) {
            clearInterval(interval);
          }
        }, 100);
        
        // Cleanup after 5 seconds
        setTimeout(() => clearInterval(interval), 5000);
        
        return () => clearInterval(interval);
      }
    }
  }, [isDemoMode]);

  if (!isDemoMode) return null;

  const lastUpdated = demoConfig?.lastUpdated || 'Wird geladen...';
  const buildTime = demoConfig?.buildTimestamp ? new Date(demoConfig.buildTimestamp) : new Date();

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
