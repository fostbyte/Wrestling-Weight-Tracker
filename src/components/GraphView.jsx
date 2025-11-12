// src/components/GraphView.jsx
import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { apiFetch } from "../utils/api";

export default function GraphView() {
  const [weights, setWeights] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [dataReady, setDataReady] = useState(false);
  const [wrestlers, setWrestlers] = useState([]);
  const [oneLine, setOneLine] = useState(() => {
    try { return JSON.parse(localStorage.getItem("graph_one_line") || "false"); } catch { return false; }
  });
  const [includeWeekends, setIncludeWeekends] = useState(() => {
    try { return JSON.parse(localStorage.getItem("include_weekends") || "false"); } catch { return false; }
  });

  const load = async () => {
    try {
      if (!selectedName) {
        setWeights([]);
        setDataReady(false);
        return;
      }
      const qs = selectedName ? `?wrestler=${encodeURIComponent(selectedName)}` : "";
      const data = await apiFetch(`get-weight-history${qs}`);
      setWeights(data.weights || []);
      setDataReady(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchWrestlers = async () => {
      try {
        const data = await apiFetch("get-wrestlers");
        setWrestlers(data.wrestlers || []);
      } catch (e) { console.error(e); }
    };
    fetchWrestlers();
  }, []);

  useEffect(() => {
    try { localStorage.setItem("graph_one_line", JSON.stringify(oneLine)); } catch {}
  }, [oneLine]);

  const grouped = {};
  weights.forEach(w => {
    const d = new Date(w.date).toISOString().slice(0,10);
    if (!grouped[d]) grouped[d] = { date: d, before: null, after: null };
    if (w.type === "before") grouped[d].before = w.weight;
    if (w.type === "after") grouped[d].after = w.weight;
  });

  const uniqueDates = Object.keys(grouped).sort();

  const buildDateRange = (dates) => {
    if (!dates.length) return [];
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const out = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = new Date(d).toISOString().slice(0,10);
      out.push(iso);
    }
    return out;
  };

  const datesTimeline = includeWeekends ? buildDateRange(uniqueDates) : uniqueDates;

  const chartData = (() => {
    if (!oneLine) {
      return datesTimeline.map(date => ({
        date,
        before: grouped[date]?.before ?? null,
        after: grouped[date]?.after ?? null,
      }));
    }
    const pts = [];
    datesTimeline.forEach((date, idx) => {
      const g = grouped[date] || { before: null, after: null };
      if (g.before != null) pts.push({ x: idx, date, weight: g.before });
      if (g.after != null) pts.push({ x: idx + 0.2, date, weight: g.after });
    });
    return pts;
  })();

  const selectedWrestler = wrestlers.find(w => (
    `${w.firstName || ""} ${w.lastName || ""}`.trim().toLowerCase() === selectedName.trim().toLowerCase()
  ));
  const title = selectedWrestler
    ? `Weight Graph - ${selectedWrestler.firstName || ""} ${selectedWrestler.lastName || ""}`.trim() +
      ` (${selectedWrestler.weightClass || "-"}${selectedWrestler.sex ? ", " + selectedWrestler.sex : ""})`
    : "Weight Graph";

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="bg-gray-800 p-6 rounded mb-4">
        <div className="mb-3">
          <input placeholder="Start typing a wrestler's name" value={selectedName} onChange={e => setSelectedName(e.target.value)} className="p-2 bg-gray-700 mr-2" list="wrestler-list" />
          <button onClick={load} className="bg-purple-600 p-2 text-white rounded">Load</button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={oneLine} onChange={e => setOneLine(e.target.checked)} />
            <span>1 line graph</span>
          </label>
          <span className="opacity-75">Weekends: {includeWeekends ? "Included" : "Excluded unless weigh-in"}</span>
        </div>
        <datalist id="wrestler-list">
          {wrestlers.map(w => (
            <option key={w.id} value={`${w.firstName || ""} ${w.lastName || ""}`.trim()} />
          ))}
        </datalist>
        {!selectedName ? (
          <div className="text-gray-300">Select a wrestler to load the graph.</div>
        ) : dataReady ? (
          <ResponsiveContainer width="100%" height={400}>
            {!oneLine ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="before" stroke="#a855f7" />
                <Line type="monotone" dataKey="after" stroke="#f59e0b" />
              </LineChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" dataKey="x" tickFormatter={(v) => {
                  const i = Math.round(v);
                  return datesTimeline[i] || "";
                }} ticks={datesTimeline.map((_, i) => i)} stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip labelFormatter={(v) => {
                  const i = Math.round(v);
                  return datesTimeline[i] || "";
                }} />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#a855f7" />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (<div>Press Load to begin</div>)}
      </div>
    </div>
  );
}
