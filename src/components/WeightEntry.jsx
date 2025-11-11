
// src/components/WeightEntry.jsx
import React, { useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";

export default function WeightEntry() {
  const { school } = useContext(SchoolContext);
  const [wrestlers, setWrestlers] = useState([]);
  const [selected, setSelected] = useState("");
  const [weight, setWeight] = useState("");
  const [type, setType] = useState("before");
  const [customDate, setCustomDate] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState("first"); // first | last | weight

  useEffect(() => { loadWrestlers(); }, []);

  const loadWrestlers = async () => {
    try {
      const data = await apiFetch("get-wrestlers");
      setWrestlers(data.wrestlers);
    } catch (e) { console.error(e); }
  };

  const submit = async () => {
    try {
      if (!selected || !weight) return alert("Select wrestler and weight");
      const [firstName, ...rest] = selected.split(" ");
      const lastName = rest.join(" ");
      const dateToUse = customDate || new Date().toLocaleDateString("en-US");
      await apiFetch("add-weight-record", {
        method: "POST",
        body: { firstName, lastName, date: dateToUse, weight, type }
      });
      alert("Saved");
     setWeight(""); setCustomDate("");
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Record Weight - {school.name || school.code}</h2>
      <div className="bg-gray-800 p-6 rounded">
        {/* Filter input and cards to quickly select a wrestler */}
        <div className="bg-gray-900 p-4 rounded mb-4">
          <input
            placeholder="Filter by name or weight class"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full p-2 bg-gray-700 mb-3"
          />
          <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
            <span className="opacity-80">Sort by:</span>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input type="radio" name="sortby" checked={sortBy === "first"} onChange={() => setSortBy("first")} />
              <span>First</span>
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input type="radio" name="sortby" checked={sortBy === "last"} onChange={() => setSortBy("last")} />
              <span>Last</span>
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input type="radio" name="sortby" checked={sortBy === "weight"} onChange={() => setSortBy("weight")} />
              <span>Weight</span>
            </label>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {wrestlers
                .filter(w => {
                  const f = filterText.trim().toLowerCase();
                  if (!f) return true;
                  return (
                    (w.firstName || "").toLowerCase().includes(f) ||
                    (w.lastName || "").toLowerCase().includes(f) ||
                    String(w.weightClass || "").toLowerCase().includes(f)
                  );
                })
                .slice()
                .sort((a, b) => {
                  const aFirst = (a.firstName || "").toLowerCase();
                  const aLast = (a.lastName || "").toLowerCase();
                  const bFirst = (b.firstName || "").toLowerCase();
                  const bLast = (b.lastName || "").toLowerCase();
                  const aW = String(a.weightClass ?? "").toLowerCase();
                  const bW = String(b.weightClass ?? "").toLowerCase();
                  if (sortBy === "last") return aLast.localeCompare(bLast) || aFirst.localeCompare(bFirst);
                  if (sortBy === "weight") return aW.localeCompare(bW) || aLast.localeCompare(bLast) || aFirst.localeCompare(bFirst);
                  return aFirst.localeCompare(bFirst) || aLast.localeCompare(bLast);
                })
                .map(w => (
                  <div key={w.id} className="bg-gray-700 rounded p-2 sm:p-3">
                    <div className="text-base sm:text-lg font-semibold">{w.firstName} {w.lastName}</div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-2">Weight Class: {w.weightClass || "-"}</div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
                        onClick={() => { setSelected(`${w.firstName} ${w.lastName}`); setType("before"); }}
                      >Before</button>
                      <button
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
                        onClick={() => { setSelected(`${w.firstName} ${w.lastName}`); setType("after"); }}
                      >After</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <label>Weight (lbs)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700"
        />

        <div className="mb-4">
          <label><input type="radio" checked={type==="before"} onChange={() => setType("before")} /> Before</label>
          <label className="ml-4"><input type="radio" checked={type==="after"} onChange={() => setType("after")} /> After</label>
        </div>

        <label>Date (optional)</label>
        <input value={customDate} onChange={e => setCustomDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full p-2 mb-4 bg-gray-700" />

        <button onClick={submit} className="bg-purple-600 p-2 text-white rounded">Submit Weight</button>
      </div>
    </div>
  );
}
