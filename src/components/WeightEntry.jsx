
// src/components/WeightEntry.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";
import { useNotify } from "../context/NotifyContext";
import { useWrestlers } from "../context/WrestlersContext";

export default function WeightEntry() {
  const { school } = useContext(SchoolContext);
  const { notify } = useNotify();
  const { wrestlers, ensureLoaded } = useWrestlers();
  const [selected, setSelected] = useState("");
  const [weight, setWeight] = useState("");
  const [type, setType] = useState("before");
  const [customDate, setCustomDate] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState("first"); // first | last | weight
  const [hideWeighedIn, setHideWeighedIn] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hide_weighed_in") || "true"); } catch { return false; }
  });
  const [hiddenMap, setHiddenMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hidden_weighed_in_map") || "{}"); } catch { return {}; }
  }); // { [wrestlerId]: timestamp }
  const [lastActivity, setLastActivity] = useState(() => {
    try { return Number(localStorage.getItem("last_activity_ts")) || Date.now(); } catch { return Date.now(); }
  });
  const weightInputRef = useRef(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
 
  useEffect(() => {
    try { localStorage.setItem("hide_weighed_in", JSON.stringify(hideWeighedIn)); } catch {}
  }, [hideWeighedIn]);
  useEffect(() => {
    try { localStorage.setItem("hidden_weighed_in_map", JSON.stringify(hiddenMap)); } catch {}
  }, [hiddenMap]);
 
  useEffect(() => {
    const onActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      try { localStorage.setItem("last_activity_ts", String(now)); } catch {}
    };
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach(ev => window.addEventListener(ev, onActivity));

    const interval = setInterval(() => {
      const INACTIVE_MS = 15 * 60 * 1000;
      if (Date.now() - lastActivity >= INACTIVE_MS && Object.keys(hiddenMap).length) {
        setHiddenMap({});
      }
    }, 10000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, onActivity));
      clearInterval(interval);
    };
  }, [lastActivity, hiddenMap]);

  const submit = async () => {
    try {
      if (!selected || !weight) return notify("Select wrestler and weight", "warning");
      const [firstName, ...rest] = selected.split(" ");
      const lastName = rest.join(" ");
      const dateToUse = customDate
        ? (/^\d{4}-\d{2}-\d{2}$/.test(customDate)
            ? `${customDate.slice(5,7)}/${customDate.slice(8,10)}/${customDate.slice(0,4)}`
            : customDate)
        : new Date().toLocaleDateString("en-US");
      await apiFetch("add-weight-record", {
        method: "POST",
        body: { firstName, lastName, date: dateToUse, weight, type }
      });
      notify("Saved", "success");
      setWeight(""); 
      if (weightInputRef.current) weightInputRef.current.blur();
      if (document && document.activeElement && typeof document.activeElement.blur === 'function') {
        try { document.activeElement.blur(); } catch {}
      }

      if (hideWeighedIn) {
        const matched = wrestlers.find(w => (w.firstName || "") + " " + (w.lastName || "") === `${firstName} ${lastName}`);
        if (matched && matched.id != null) {
          setHiddenMap(prev => ({ ...prev, [matched.id]: Date.now() }));
        }
      }
    } catch (e) { notify(e.message, "error"); }
  };

  const chooseWrestler = (w, t) => {
    setSelected(`${w.firstName} ${w.lastName}`);
    setType(t);
    if (weightInputRef.current) weightInputRef.current.focus();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Record Weight - {school.name || school.code}</h2>
      <div className="bg-gray-800 p-6 rounded">
        {/* Filter input and cards to quickly select a wrestler */}
        <div className="bg-gray-900 p-4 rounded mb-4">
          <div className="flex items-center justify-between mb-3 text-sm text-gray-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideWeighedIn}
                onChange={e => setHideWeighedIn(e.target.checked)}
              />
              <span>Hide weighed-in wrestlers (return after 15 min inactivity)</span>
            </label>
          </div>
          <input
            placeholder="Filter by name or weight class"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full p-2 bg-gray-700 mb-3"
          />
          <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
            <span className="opacity-80">Sort by:</span>
            <div className="bg-gray-700 rounded-md overflow-hidden">
              <div className="flex text-sm">
                <button type="button" onClick={() => setSortBy("first")} className={`px-3 py-2 ${sortBy==="first"?"bg-purple-600 text-white":"text-gray-200"}`}>First</button>
                <button type="button" onClick={() => setSortBy("last")} className={`px-3 py-2 ${sortBy==="last"?"bg-purple-600 text-white":"text-gray-200"}`}>Last</button>
                <button type="button" onClick={() => setSortBy("weight")} className={`px-3 py-2 ${sortBy==="weight"?"bg-purple-600 text-white":"text-gray-200"}`}>Weight</button>
              </div>
            </div>
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
                .filter(w => !(hideWeighedIn && !filterText.trim() && hiddenMap[w.id]))
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
                .map(w => {
                  const isSel = selected === `${w.firstName} ${w.lastName}`;
                  const primary = school?.primary_color || "#7c3aed";
                  const secondary = school?.secondary_color || "#f59e0b";
                  const bg = !isSel ? "#374151" : (type === "before" ? primary : secondary);
                  const ringColor = isSel ? (type === "before" ? primary : secondary) : "transparent";
                  return (
                  <div
                    key={w.id}
                    className={`rounded p-2 sm:p-3 transition-colors`}
                    style={{ backgroundColor: bg, boxShadow: isSel ? `0 0 0 2px ${ringColor}` : "none" }}
                  >
                    <div className="text-base sm:text-lg font-semibold">{w.firstName} {w.lastName}</div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-2">Weight Class: {w.weightClass || "-"}</div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
                        style={{ backgroundColor: primary }}
                        onClick={() => chooseWrestler(w, "before")}
                      >Before</button>
                      <button
                        className="flex-1 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
                        style={{ backgroundColor: secondary }}
                        onClick={() => chooseWrestler(w, "after")}
                      >After</button>
                    </div>
                  </div>
                );})}
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
          ref={weightInputRef}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          className="w-full p-2 mb-4 bg-gray-700"
        />

        <div className="mb-4">
          <div className="bg-gray-700 rounded-md overflow-hidden inline-flex">
            <button type="button" onClick={() => setType("before")} className={`px-3 py-2 ${type==="before"?"text-white":"text-gray-200"}`} style={{ backgroundColor: type==="before" ? (school?.primary_color || "#7c3aed") : "transparent" }}>Before</button>
            <button type="button" onClick={() => setType("after")} className={`px-3 py-2 ${type==="after"?"text-white":"text-gray-200"}`} style={{ backgroundColor: type==="after" ? (school?.secondary_color || "#f59e0b") : "transparent" }}>After</button>
          </div>
        </div>

        <label>Date (optional)</label>
        <input
          type="date"
          value={/^\d{2}\/\d{2}\/\d{4}$/.test(customDate) ? `${customDate.slice(6)}-${customDate.slice(0,2)}-${customDate.slice(3,5)}` : customDate}
          onChange={e => setCustomDate(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700"
        />

        <button onClick={submit} className="bg-purple-600 p-2 text-white rounded">Submit Weight</button>
      </div>
    </div>
  );
}
