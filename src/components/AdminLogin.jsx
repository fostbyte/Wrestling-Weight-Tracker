// src/components/AdminLogin.jsx
import React, { useState } from "react";
import api from "../utils/api";
import AdminDashboard from "./AdminDashboard";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("admin_token"));

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setNotification(null);
    try {
      // This uses the api utility to call the correct path
      const data = await api.adminLogin(username, password);
      localStorage.setItem("admin_token", data.token);
      setAdminToken(data.token);
      setPassword("");
    } catch (err) {
      setNotification({ type: "error", message: err.message });
      setPassword("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
  };

  if (adminToken) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center">Admin Login</h1>
        {notification && <div className="mb-4 text-red-400">{notification.message}</div>}
        <form onSubmit={handleAdminLogin} autoComplete="off">
          <label className="block mb-2">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 rounded" />
          <label className="block mb-2">Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 rounded" />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded">Login</button>
        </form>
      </div>
    </div>
  );
}