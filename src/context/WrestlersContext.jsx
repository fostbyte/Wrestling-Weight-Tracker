import React, { createContext, useContext, useState, useCallback } from "react";
import { apiFetch } from "../utils/api";

const WrestlersContext = createContext(null);

export function WrestlersProvider({ children }) {
  const [wrestlers, setWrestlers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("get-wrestlers");
      setWrestlers(data.wrestlers || []);
    } catch (e) {
    }
    setLoading(false);
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (!wrestlers || wrestlers.length === 0) {
      await refresh();
    }
  }, [wrestlers, refresh]);

  return (
    <WrestlersContext.Provider value={{ wrestlers, setWrestlers, loading, ensureLoaded, refresh }}>
      {children}
    </WrestlersContext.Provider>
  );
}

export function useWrestlers() {
  const ctx = useContext(WrestlersContext);
  return ctx;
}
