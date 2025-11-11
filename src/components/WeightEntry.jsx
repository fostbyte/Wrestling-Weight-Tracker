
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
        <label>Wrestler</label>
        <input
          list="wrestler-list"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          placeholder="Start typing a name..."
          className="w-full p-2 mb-4 bg-gray-700"
        />
        <datalist id="wrestler-list">
          {wrestlers.map(w => (
            <option key={w.id} value={`${w.firstName} ${w.lastName}`}>{w.name} ({w.weightClass})</option>
          ))}
        </datalist>

        <label>Weight (lbs)</label>
        <input value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 mb-4 bg-gray-700" />

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
