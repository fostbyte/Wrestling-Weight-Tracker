// src/components/OptionsPanel.jsx
import React, { useContext, useState } from "react";
import { SchoolContext } from "../context/SchoolContext";
import { apiFetch } from "../utils/api";

export default function OptionsPanel() {
  const { school, setSchool } = useContext(SchoolContext);
  const [name, setName] = useState(school.name || "");
  const [password, setPassword] = useState("");
  const [primary, setPrimary] = useState(school.primary_color || "#7c3aed");
  const [secondary, setSecondary] = useState(school.secondary_color || "#fbbf24");
  const [message, setMessage] = useState(null);

  const save = async () => {
    try {
      const data = await apiFetch("update-schools-settings", {
        method: "POST",
        body: { name, password: password || undefined, primary_color: primary, secondary_color: secondary }
      });
      setSchool(prev => ({ ...prev, name: data.school.name, primary_color: data.school.primary_color, secondary_color: data.school.secondary_color }));
      setPassword("");
      setMessage({ type: "success", text: "Saved" });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Options - {school.code}</h2>
      <div className="bg-gray-800 p-6 rounded max-w-md">
        <label className="block mb-1">School Banner Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 mb-4 bg-gray-700" />

        <label className="block mb-1">Change Password (leave blank to keep)</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mb-4 bg-gray-700" />

        <label className="block mb-1">Primary Color (hex)</label>
        <div className="flex items-center mb-4">
          <input
            type="color"
            value={primary}
            onChange={e => setPrimary(e.target.value)}
            className="mr-3 h-10 w-16 p-0 bg-transparent border-0"
          />
          <input
            value={primary}
            onChange={e => setPrimary(e.target.value)}
            className="flex-1 p-2 bg-gray-700"
          />
        </div>

        <label className="block mb-1">Secondary Color (hex)</label>
        <div className="flex items-center mb-4">
          <input
            type="color"
            value={secondary}
            onChange={e => setSecondary(e.target.value)}
            className="mr-3 h-10 w-16 p-0 bg-transparent border-0"
          />
          <input
            value={secondary}
            onChange={e => setSecondary(e.target.value)}
            className="flex-1 p-2 bg-gray-700"
          />
        </div>

        <button onClick={save} className="bg-purple-600 p-2 text-white rounded">Save Options</button>
        {message && <div className={`mt-3 ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>{message.text}</div>}
      </div>
    </div>
  );
}
