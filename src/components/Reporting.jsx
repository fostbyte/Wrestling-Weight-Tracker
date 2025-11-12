import React, { useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { SchoolContext } from "../context/SchoolContext";
import { useWrestlers } from "../context/WrestlersContext";

export default function Reporting() {
  const { school } = useContext(SchoolContext);
  const { wrestlers } = useWrestlers();
  const [weights, setWeights] = useState([]);
  const [reportType, setReportType] = useState("graphs");
  const [sexFilter, setSexFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Do not auto-refresh data on mount. User must click "Update data".

  // Keep selectedIds in sync when Select All is enabled or filters change
  useEffect(() => {
    if (selectAll) {
      setSelectedIds(filteredWrestlers.map(w => w.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAll, wrestlers, weights, sexFilter]);

  const filteredWrestlers = useMemo(() => {
    let list = wrestlers.slice();
    if (sexFilter !== "All") list = list.filter(w => (w.sex || "") === sexFilter);
    list.sort((a,b) => (`${a.firstName||""} ${a.lastName||""}`.toLowerCase()).localeCompare(`${b.firstName||""} ${b.lastName||""}`.toLowerCase()));
    return list;
  }, [wrestlers, sexFilter]);

  const perWrestler = useMemo(() => {
    const map = new Map();
    for (const w of weights) {
      if (!map.has(w.wrestlerId)) map.set(w.wrestlerId, []);
      map.get(w.wrestlerId).push(w);
    }
    for (const arr of map.values()) arr.sort((a,b)=> new Date(a.date) - new Date(b.date));
    return map;
  }, [weights]);

  const practiceDates = useMemo(() => {
    const byDate = new Map();
    for (const w of weights) {
      if (w.type !== "before") continue;
      const d = new Date(w.date);
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      const key = new Date(d).toISOString().slice(0,10);
      if (!byDate.has(key)) byDate.set(key, new Set());
      byDate.get(key).add(w.wrestlerId);
    }
    const valid = [];
    for (const [d,setIds] of byDate.entries()) if (setIds.size >= 2) valid.push(d);
    valid.sort();
    return valid;
  }, [weights]);

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };
 
  const allOrSelected = selectAll ? filteredWrestlers : (selectedIds.length ? filteredWrestlers.filter(w=>selectedIds.includes(w.id)) : []);

  const graphDataFor = (wid) => {
    const arr = perWrestler.get(wid) || [];
    const grouped = {};
    for (const r of arr) {
      const d = new Date(r.date).toISOString().slice(0,10);
      if (!grouped[d]) grouped[d] = { date: d, before: null, after: null };
      if (r.type === "before") grouped[d].before = r.weight;
      if (r.type === "after") grouped[d].after = r.weight;
    }
    return Object.values(grouped);
  };

  const avgLossFor = (wid) => {
    const arr = perWrestler.get(wid) || [];
    const byDate = new Map();
    for (const r of arr) {
      const d = new Date(r.date).toISOString().slice(0,10);
      if (!byDate.has(d)) byDate.set(d, { before:null, after:null });
      if (r.type === "before") byDate.get(d).before = r.weight;
      if (r.type === "after") byDate.get(d).after = r.weight;
    }
    let sum = 0, n = 0;
    for (const v of byDate.values()) {
      if (v.before != null && v.after != null) { sum += (v.before - v.after); n++; }
    }
    return n ? (sum / n) : null;
  };

  const missingCountFor = (wid) => {
    const arr = perWrestler.get(wid) || [];
    const haveBefore = new Set();
    for (const r of arr) if (r.type === "before") haveBefore.add(new Date(r.date).toISOString().slice(0,10));
    let miss = 0;
    for (const d of practiceDates) if (!haveBefore.has(d)) miss++;
    return miss;
  };

  const startPrint = () => window.print();

  const updateData = async () => {
    setUpdating(true);
    try {
      const targets = (selectAll ? filteredWrestlers : filteredWrestlers.filter(w => selectedIds.includes(w.id)));
      const all = [];
      for (const w of targets) {
        const name = `${w.firstName || ""} ${w.lastName || ""}`.trim();
        if (!name) continue;
        try {
          const data = await apiFetch(`get-weight-history?wrestler=${encodeURIComponent(name)}`);
          const records = (data.weights || []).map(r => ({
            ...r,
            wrestlerId: r.wrestlerId ?? r.wrestler_id ?? w.id,
          }));
          all.push(...records);
        } catch (e) {
        }
      }
      setWeights(all);
    } finally {
      setUpdating(false);
    }
  };

  const reportTitle = reportType === "graphs"
    ? "Weight Charts"
    : reportType === "avg"
      ? "Average Weight Loss per Practice"
      : "Missing Practices";

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reporting</h2>
      <div className="bg-gray-800 p-4 rounded mb-4 flex flex-wrap gap-3 items-center no-print">
        <select value={reportType} onChange={e=>setReportType(e.target.value)} className="p-2 bg-gray-700">
          <option value="graphs">Graphs</option>
          <option value="avg">Average Weight Loss</option>
          <option value="missing">Missing Practices</option>
        </select>
        <div className="bg-gray-700 rounded-md overflow-hidden">
          <div className="flex text-sm">
            <button type="button" onClick={()=>setSexFilter("Male")} className={`px-3 py-2 ${sexFilter==="Male"?"bg-purple-600 text-white":"text-gray-200"}`}>Boys</button>
            <button type="button" onClick={()=>setSexFilter("Female")} className={`px-3 py-2 ${sexFilter==="Female"?"bg-purple-600 text-white":"text-gray-200"}`}>Girls</button>
            <button type="button" onClick={()=>setSexFilter("All")} className={`px-3 py-2 ${sexFilter==="All"?"bg-purple-600 text-white":"text-gray-200"}`}>Full team</button>
          </div>
        </div>
        {reportType === "graphs" && null}
        <button onClick={updateData} disabled={updating} className="bg-gray-600 p-2 text-white rounded">{updating?"Updating...":"Update data"}</button>
        <button onClick={startPrint} className="bg-purple-600 p-2 text-white rounded">Print</button>
      </div>

      <div className="bg-gray-800 p-4 rounded mb-4 max-h-60 overflow-y-auto no-print">
        <div className="flex items-center justify-between mb-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} />
            <span>Select all wrestlers</span>
          </label>
          <span className="text-xs text-gray-300">{allOrSelected.length} selected</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredWrestlers.map(w => (
            <label key={w.id} className={`p-2 rounded cursor-pointer ${selectedIds.includes(w.id)?"bg-purple-700":"bg-gray-700"}`}>
              <input type="checkbox" className="mr-2" checked={selectAll || selectedIds.includes(w.id)} disabled={selectAll} onChange={()=>toggleSelected(w.id)} />
              {w.firstName} {w.lastName} {w.weightClass?`(${w.weightClass})`:""}
            </label>
          ))}
        </div>
      </div>

      <div className="report-print">
        <div className="hidden print:block text-center mb-4">
          <div className="text-3xl font-bold">{school?.name || school?.code}</div>
          <div className="text-xl mt-1">{reportTitle}</div>
        </div>

      {reportType === "graphs" && (
        <div className="flex flex-col gap-3">
          {allOrSelected
            .filter(w => (perWrestler.get(w.id) || []).length > 0)
            .map(w => (
              <div key={w.id} className="bg-gray-800 p-2 rounded break-inside-avoid print-chart-tile">
                <div className="text-sm font-semibold mb-1">{w.firstName} {w.lastName} {w.weightClass?`(${w.weightClass})`:""}</div>
                <div className="chart-fixed" style={{ width: "100%", height: "20vh" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphDataFor(w.id)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="before" stroke={school?.primary_color || "#a855f7"} dot={false} />
                      <Line type="monotone" dataKey="after" stroke={school?.secondary_color || "#f59e0b"} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
        </div>
      )}

      {reportType === "avg" && (() => {
        const list = allOrSelected.filter(w => (perWrestler.get(w.id) || []).length > 0)
          .map(w => ({ w, val: (avgLossFor(w.id) ?? 0) }));
        const half = Math.ceil(list.length / 2);
        const left = list.slice(0, half);
        const right = list.slice(half);
        const rows = Math.max(left.length, right.length);
        return (
          <div className="grid grid-cols-4 gap-0 text-sm border border-gray-600">
            {[...Array(rows)].map((_, i) => {
              const rowBg = i % 2 === 0 ? "bg-gray-800" : "bg-gray-700";
              const cellCls = `${rowBg} p-2 border border-gray-600`;
              return (
                <React.Fragment key={i}>
                  <div className={cellCls}>{left[i] ? `${left[i].w.firstName} ${left[i].w.lastName} ${left[i].w.weightClass?`(${left[i].w.weightClass})`:''}` : ''}</div>
                  <div className={`${cellCls} font-mono`}>{left[i] ? `${left[i].val.toFixed(2)} lbs` : ''}</div>
                  <div className={cellCls}>{right[i] ? `${right[i].w.firstName} ${right[i].w.lastName} ${right[i].w.weightClass?`(${right[i].w.weightClass})`:''}` : ''}</div>
                  <div className={`${cellCls} font-mono`}>{right[i] ? `${right[i].val.toFixed(2)} lbs` : ''}</div>
                </React.Fragment>
              );
            })}
          </div>
        );
      })()}

      {reportType === "missing" && (() => {
        const list = allOrSelected
          .filter(w => (perWrestler.get(w.id) || []).length > 0)
          .map(w => ({ w, val: missingCountFor(w.id) }))
          .sort((a,b) => b.val - a.val);
        const half = Math.ceil(list.length / 2);
        const left = list.slice(0, half);
        const right = list.slice(half);
        const rows = Math.max(left.length, right.length);
        return (
          <div className="grid grid-cols-4 gap-0 text-sm border border-gray-600">
            {[...Array(rows)].map((_, i) => {
              const rowBg = i % 2 === 0 ? "bg-gray-800" : "bg-gray-700";
              const cellCls = `${rowBg} p-2 border border-gray-600`;
              return (
                <React.Fragment key={i}>
                  <div className={cellCls}>{left[i] ? `${left[i].w.firstName} ${left[i].w.lastName} ${left[i].w.weightClass?`(${left[i].w.weightClass})`:''}` : ''}</div>
                  <div className={`${cellCls} font-mono`}>{left[i] ? `${left[i].val}` : ''}</div>
                  <div className={cellCls}>{right[i] ? `${right[i].w.firstName} ${right[i].w.lastName} ${right[i].w.weightClass?`(${right[i].w.weightClass})`:''}` : ''}</div>
                  <div className={`${cellCls} font-mono`}>{right[i] ? `${right[i].val}` : ''}</div>
                </React.Fragment>
              );
            })}
          </div>
        );
      })()}
      </div>

      <style>{`@media print {
        @page { margin: 0.5in; }
        body * { visibility: hidden; }
        .report-print, .report-print * { visibility: visible; }
        .report-print { position: absolute; top: 0; left: 0; width: 100%; padding: 0; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
        .print-chart-tile { margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; -webkit-region-break-inside: avoid; }
        .chart-fixed { height: 180px !important; }
        body { background: white !important; }
      }`}</style>
    </div>
  );
}
