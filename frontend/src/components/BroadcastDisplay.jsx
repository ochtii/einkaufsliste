import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

const BroadcastDisplay = () => {
  const { user, token } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [minimizedBroadcasts, setMinimizedBroadcasts] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadBroadcasts = useCallback(async () => {
    try {
      const broadcasts = await api.fetchBroadcasts(token);
      setBroadcasts(broadcasts);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      loadBroadcasts();
    }
  }, [user, loadBroadcasts]);

  const handleConfirmBroadcast = async (broadcastId) => {
    try {
      await api.confirmBroadcast(broadcastId, token);
      
      const broadcast = broadcasts.find(b => b.id === broadcastId);
      if (broadcast?.is_permanent) {
        // For permanent broadcasts, mark as minimized
        setMinimizedBroadcasts(prev => new Set([...prev, broadcastId]));
      } else {
        // For non-permanent broadcasts, remove completely
        setBroadcasts(broadcasts.filter(b => b.id !== broadcastId));
      }
    } catch (error) {
      console.error('Error confirming broadcast:', error);
    }
  };

  const handleDismissBroadcast = (broadcastId) => {
    const broadcast = broadcasts.find(b => b.id === broadcastId);
    if (broadcast?.is_permanent) {
      // For permanent broadcasts, just minimize
      setMinimizedBroadcasts(prev => new Set([...prev, broadcastId]));
    } else {
      // For non-permanent broadcasts, remove completely
      setBroadcasts(broadcasts.filter(b => b.id !== broadcastId));
    }
  };

  const handleExpandBroadcast = (broadcastId) => {
    setMinimizedBroadcasts(prev => {
      const newSet = new Set(prev);
      newSet.delete(broadcastId);
      return newSet;
    });
  };

  const getBroadcastTypeColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-900/20 border-yellow-700 text-yellow-200';
      case 'important': return 'bg-red-900/20 border-red-700 text-red-200';
      case 'success': return 'bg-green-900/20 border-green-700 text-green-200';
      default: return 'bg-blue-900/20 border-blue-700 text-blue-200';
    }
  };

  const getBroadcastTypeIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'important': return '❗';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  if (loading || broadcasts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {broadcasts.map((broadcast) => {
        const isMinimized = minimizedBroadcasts.has(broadcast.id);
        const isConfirmed = broadcast.is_confirmed;
        
        if (isMinimized) {
          // Minimized view for permanent broadcasts
          return (
            <div 
              key={broadcast.id} 
              className="bg-gray-800 border border-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleExpandBroadcast(broadcast.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getBroadcastTypeIcon(broadcast.type)}</span>
                  <span className="text-sm font-medium text-gray-300">{broadcast.title}</span>
                  {isConfirmed && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      ✓ Bestätigt
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Klicken zum Erweitern
                </div>
              </div>
            </div>
          );
        }
        
        // Full view
        return (
          <div 
            key={broadcast.id} 
            className={`rounded-lg p-4 border-2 ${getBroadcastTypeColor(broadcast.type)} shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getBroadcastTypeIcon(broadcast.type)}</span>
                  <h4 className="font-semibold text-lg">{broadcast.title}</h4>
                  {broadcast.is_permanent && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      📌 Permanent
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      ✓ Bestätigt
                    </span>
                  )}
                </div>
                <p className="mb-3 text-base leading-relaxed">{broadcast.message}</p>
                {broadcast.expires_at && (
                  <div className="text-sm opacity-75 mb-2">
                    ⏰ Läuft ab: {new Date(broadcast.expires_at).toLocaleString('de-DE')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {broadcast.requires_confirmation ? (
                  <button
                    onClick={() => handleConfirmBroadcast(broadcast.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                  >
                    ✓ Verstanden
                  </button>
                ) : (
                  <>
                    {broadcast.is_permanent ? (
                      <button
                        onClick={() => handleDismissBroadcast(broadcast.id)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        📌 Minimieren
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDismissBroadcast(broadcast.id)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        ✕ Schließen
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BroadcastDisplay;
