import { useState, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    
    setToasts(current => [...current, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'success':
        return 'bg-green-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${getTypeStyles()} flex items-center justify-between min-w-64 max-w-96`}>
      <span>{toast.message}</span>
      <button 
        onClick={() => onClose(toast.id)}
        className="ml-4 text-lg font-bold hover:opacity-70"
        aria-label="Schließen"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
