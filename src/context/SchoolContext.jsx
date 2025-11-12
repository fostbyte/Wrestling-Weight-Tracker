// src/context/SchoolContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [school, setSchool] = useState(() => {
    try {
      const token = localStorage.getItem("lw_token");
      if (!token) return null;
      return JSON.parse(localStorage.getItem("lw_school")) || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (school) localStorage.setItem("lw_school", JSON.stringify(school));
    else localStorage.removeItem("lw_school");
  }, [school]);

  const setAuth = ({ token, school: schoolInfo, remember }) => {
    if (token) localStorage.setItem("lw_token", token);
    if (remember) localStorage.setItem("lw_school", JSON.stringify(schoolInfo));
    if (remember) localStorage.setItem("lw_remember", "1"); else localStorage.removeItem("lw_remember");
    if (token) localStorage.setItem("lw_token_issued_at", String(Date.now()));
    setSchool(schoolInfo);
  };

  const logout = () => {
    localStorage.removeItem("lw_token");
    localStorage.removeItem("lw_school");
    localStorage.removeItem("lw_remember");
    localStorage.removeItem("lw_token_issued_at");
    setSchool(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("lw_token");
    if (!token) return;
    const issuedAt = Number(localStorage.getItem("lw_token_issued_at") || 0);
    const remember = localStorage.getItem("lw_remember") === "1";
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    let cancelled = false;
    let timerId;

    const doRefresh = async () => {
      try {
        const data = await apiFetch("refresh-token", { method: "POST" });
        if (cancelled) return;
        if (data && data.token) {
          setAuth({ token: data.token, school: data.school || school, remember: true });
        }
      } catch (e) {
      }
    };

    const schedule = () => {
      if (!remember) return;
      const now = Date.now();
      const elapsed = now - issuedAt;
      if (elapsed >= TWELVE_HOURS) {
        doRefresh();
      } else {
        const buffer = 5 * 60 * 1000;
        const wait = Math.max(0, TWELVE_HOURS - elapsed - buffer);
        timerId = setTimeout(doRefresh, wait);
      }
    };

    schedule();
    return () => { cancelled = true; if (timerId) clearTimeout(timerId); };
  }, [school]);

  return (
    <SchoolContext.Provider value={{ school, setAuth, logout, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
};
