import { useEffect, useState } from 'react';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode
    const checkDemoMode = () => {
      const isDemo = window.location.hostname === 'ochtii.github.io' || 
                    (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));
      
      setIsDemoMode(isDemo);
      
      if (isDemo) {
        // Wait for demo config to load
        const checkDemoReady = () => {
          if (window.DEMO_CONFIG && window.DemoAPI) {
            console.log('Demo mode fully initialized');
            setDemoReady(true);
            return true;
          }
          return false;
        };
        
        // Try immediately
        if (!checkDemoReady()) {
          // If not ready, poll every 100ms for up to 3 seconds
          let attempts = 0;
          const maxAttempts = 30;
          
          const pollTimer = setInterval(() => {
            attempts++;
            if (checkDemoReady() || attempts >= maxAttempts) {
              clearInterval(pollTimer);
              if (attempts >= maxAttempts) {
                console.warn('Demo config failed to load within timeout');
                // Still set ready to true to allow fallback behavior
                setDemoReady(true);
              }
            }
          }, 100);
          
          return () => clearInterval(pollTimer);
        }
      } else {
        setDemoReady(true);
      }
    };
    
    // Check immediately
    checkDemoMode();
    
    // Also check after a short delay in case scripts are still loading
    const delayedCheck = setTimeout(checkDemoMode, 100);
    
    return () => clearTimeout(delayedCheck);
  }, []);

  return { isDemoMode, demoReady };
}
