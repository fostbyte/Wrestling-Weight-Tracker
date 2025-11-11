// src/context/SchoolContext.jsx
import React, { createContext, useState, useEffect } from "react";

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
    setSchool(schoolInfo);
  };

  const logout = () => {
    localStorage.removeItem("lw_token");
    localStorage.removeItem("lw_school");
    setSchool(null);
  };

  return (
    <SchoolContext.Provider value={{ school, setAuth, logout, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
};
