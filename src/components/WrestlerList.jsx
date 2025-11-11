
// src/components/WrestlerList.jsx
import React, { useEffect, useState, useContext } from "react";
import { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";

export default function WrestlerList() {
  const { school } = useContext(SchoolContext);
  const [wrestlers, setWrestlers] = useState([]);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newSex, setNewSex] = useState("Male");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await apiFetch("get-wrestlers");
      setWrestlers(data.wrestlers);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    setLoading(true);
    try {
      await apiFetch("add-wrestlers", { method: "POST", body: { firstName: newFirstName, lastName: newLastName, weightClass: newWeight, sex: newSex } });
      setNewFirstName(""); setNewLastName(""); setNewWeight("");
      load();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };
      

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Roster - {school.name || school.code}</h2>
      <div className="bg-gray-800 p-4 rounded mb-6">
        <div className="mb-2"><strong>Add Wrestler</strong></div>
        <input placeholder="First" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="mr-2 p-2" />
        <input placeholder="Last" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="mr-2 p-2" />
        <input placeholder="Weight" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="mr-2 p-2" />
        <select value={newSex} onChange={e => setNewSex(e.target.value)} className="mr-2 p-2">
          <option>Male</option><option>Female</option>
        </select>
        <button onClick={add} disabled={loading} className="bg-purple-600 p-2 text-white rounded">Add</button>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <table className="w-full">
          <thead><tr><th>First</th><th>Last</th><th>Weight</th><th>Sex</th></tr></thead>
          <tbody>
            {wrestlers.map(w => (
              <tr key={w.id} className="border-t">
                <td>{w.firstName}</td><td>{w.lastName}</td><td>{w.weightClass}</td><td>{w.sex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
