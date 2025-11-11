// src/components/GraphView.jsx
import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { apiFetch } from "../utils/api";

export default function GraphView() {
  const [weights, setWeights] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [dataReady, setDataReady] = useState(false);

  const load = async () => {
    try {
      const qs = selectedName ? `?wrestler=${encodeURIComponent(selectedName)}` : "";
      const res = await fetch(`/.netlify/functions/weights/get-weight-history${qs}`, { headers: { Authorization: `Bearer ${localStorage.getItem("lw_token")}` }});
      const data = await res.json();
      setWeights(data.weights || []);
      setDataReady(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const grouped = {};
  weights.forEach(w => {
    const d = new Date(w.date).toISOString().slice(0,10);
    if (!grouped[d]) grouped[d] = { date: d, before: null, after: null };
    if (w.type === "before") grouped[d].before = w.weight;
    if (w.type === "after") grouped[d].after = w.weight;
  });

  const chartData = Object.values(grouped);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Weight Graph</h2>
      <div className="bg-gray-800 p-6 rounded mb-4">
        <div className="mb-3">
          <input placeholder="Filter name (optional)" value={selectedName} onChange={e => setSelectedName(e.target.value)} className="p-2 bg-gray-700 mr-2" />
          <button onClick={load} className="bg-purple-600 p-2 text-white rounded">Load</button>
        </div>
        {dataReady ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="before" stroke="#a855f7" />
              <Line type="monotone" dataKey="after" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        ) : (<div>Loading graph...</div>)}
      </div>
    </div>
  );
}
