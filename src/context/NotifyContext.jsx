import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotifyContext = createContext({ notify: () => {}, confirm: async () => false });

export const useNotify = () => useContext(NotifyContext);

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const notify = useCallback((message, type = "info", durationMs = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), durationMs);
    }
  }, []);

  const confirm = useCallback((message) => {
    return new Promise(resolve => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type === "error" ? "bg-red-600" : t.type === "success" ? "bg-green-600" : t.type === "warning" ? "bg-yellow-600" : "bg-gray-800"}`}>
            {t.message}
          </div>
        ))}
      </div>
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="relative bg-gray-800 text-white rounded p-6 w-80 shadow-lg">
            <div className="mb-4">{confirmState.message}</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 bg-gray-600 rounded" onClick={() => { const r = confirmState.resolve; setConfirmState(null); r(false); }}>Cancel</button>
              <button className="px-3 py-1 bg-purple-600 rounded" onClick={() => { const r = confirmState.resolve; setConfirmState(null); r(true); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
}
