
// src/components/WeightEntry.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";
import { useNotify } from "../context/NotifyContext";
import { useWrestlers } from "../context/WrestlersContext";

const WrestlerCard = ({ wrestler, isSelected, type, onSelect, primaryColor, secondaryColor }) => {
  const { firstName, lastName, weightClass, id } = wrestler;
  const bg = !isSelected ? "#374151" : (type === "before" ? primaryColor : secondaryColor);
  const ringColor = isSelected ? (type === "before" ? primaryColor : secondaryColor) : "transparent";
  
  return (
    <div
      className={`rounded p-2 sm:p-3 transition-colors`}
      style={{ backgroundColor: bg, boxShadow: isSelected ? `0 0 0 2px ${ringColor}` : "none" }}
    >
      <div className="text-base sm:text-lg font-semibold">{firstName} {lastName}</div>
      <div className="text-xs sm:text-sm text-gray-300 mb-2">Weight Class: {weightClass || "-"}</div>
      <div className="flex gap-2">
        <button
          className="flex-1 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
          style={{ backgroundColor: primaryColor }}
          onClick={() => onSelect(wrestler, "before")}
        >Before</button>
        <button
          className="flex-1 text-white px-2 py-1 sm:px-3 sm:py-2 rounded"
          style={{ backgroundColor: secondaryColor }}
          onClick={() => onSelect(wrestler, "after")}
        >After</button>
      </div>
    </div>
  );
};

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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="opacity-80">Sort by:</span>
              <div className="bg-gray-700 rounded-md overflow-hidden">
                <div className="flex text-sm">
                  <button type="button" onClick={() => setSortBy("first")} className={`px-3 py-2 ${sortBy==="first"?"bg-purple-600 text-white":"text-gray-200"}`}>First</button>
                  <button type="button" onClick={() => setSortBy("last")} className={`px-3 py-2 ${sortBy==="last"?"bg-purple-600 text-white":"text-gray-200"}`}>Last</button>
                  <button type="button" onClick={() => setSortBy("weight")} className={`px-3 py-2 ${sortBy==="weight"?"bg-purple-600 text-white":"text-gray-200"}`}>Weight</button>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-md overflow-hidden">
              <div className="flex text-sm">
                <button 
                  type="button" 
                  onClick={() => setViewMode('cards')} 
                  className={`px-3 py-2 ${viewMode==='cards'?"bg-purple-600 text-white":"text-gray-200"}`}
                  title="Card View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => setViewMode('list')} 
                  className={`px-3 py-2 ${viewMode==='list'?"bg-purple-600 text-white":"text-gray-200"}`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {viewMode === 'cards' ? (
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
                  .map(w => (
                    <WrestlerCard 
                      key={w.id} 
                      wrestler={w} 
                      isSelected={selected === `${w.firstName} ${w.lastName}`}
                      type={type}
                      onSelect={chooseWrestler}
                      primaryColor={school?.primary_color || "#7c3aed"}
                      secondaryColor={school?.secondary_color || "#f59e0b"}
                    />
                  ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Weight Class</th>
                      <th className="text-right py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
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
                      .map((w, index) => {
                        const isSel = selected === `${w.firstName} ${w.lastName}`;
                        const primary = school?.primary_color || "#7c3aed";
                        const secondary = school?.secondary_color || "#f59e0b";
                        const bg = isSel ? (type === "before" ? primary : secondary) : 'transparent';
                        const textColor = isSel ? 'text-white' : 'text-gray-200';
                        
                        return (
                          <tr 
                            key={w.id} 
                            className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700`}
                            style={{ backgroundColor: bg }}
                          >
                            <td className={`py-2 px-4 ${textColor} font-medium`}>
                              {w.firstName} {w.lastName}
                            </td>
                            <td className={`py-2 px-4 ${textColor}`}>
                              {w.weightClass || '-'}
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  className={`px-3 py-1 rounded text-sm ${isSel && type === 'before' ? 'text-white' : 'text-gray-200'}`}
                                  style={{ backgroundColor: isSel && type === 'before' ? primary : '#4b5563' }}
                                  onClick={() => chooseWrestler(w, "before")}
                                >
                                  Before
                                </button>
                                <button
                                  className={`px-3 py-1 rounded text-sm ${isSel && type === 'after' ? 'text-white' : 'text-gray-200'}`}
                                  style={{ backgroundColor: isSel && type === 'after' ? secondary : '#4b5563' }}
                                  onClick={() => chooseWrestler(w, "after")}
                                >
                                  After
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
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
