// src/components/LoginScreen.jsx
import React, { useState, useContext } from "react";
import api from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";

export default function LoginScreen() {
  const { setAuth } = useContext(SchoolContext);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await api.login(code, password);
      setAuth({ token: data.token, school: data.school, remember });
    } catch (err) {
      console.log(err);
      console.log(err.message);
      setNotification({ type: "error", message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center">Lennard Wrestling</h1>
        {notification && <div className="mb-4 text-red-400">{notification.message}</div>}
        <form onSubmit={handleLogin}>
          <label className="block mb-2">School Code</label>
          <input value={code} onChange={e => setCode(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 rounded" />
          <label className="block mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 rounded" />
          <label className="inline-flex items-center mb-4">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="mr-2" />
            Save credentials
          </label>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded">Login</button>
        </form>
      </div>
    </div>
  );
}
