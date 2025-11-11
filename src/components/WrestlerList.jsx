
// src/components/WrestlerList.jsx
import React, { useEffect, useState, useContext } from "react";
import api, { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";

export default function WrestlerList() {
  const { school } = useContext(SchoolContext);
  const [wrestlers, setWrestlers] = useState([]);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newSex, setNewSex] = useState("Male");
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editSex, setEditSex] = useState("Male");

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
  
  const startEdit = (w) => {
    setEditingId(w.id);
    setMenuOpenId(null);
    setEditFirst(w.firstName || "");
    setEditLast(w.lastName || "");
    setEditWeight(w.weightClass || "");
    setEditSex(w.sex || "Male");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    try {
      await api.updateWrestler({ id: editingId, firstName: editFirst, lastName: editLast, weightClass: editWeight, sex: editSex });
      setEditingId(null);
      await load();
    } catch (e) { alert(e.message); }
  };

  const deleteRow = async (id) => {
    setMenuOpenId(null);
    if (!window.confirm("Delete this wrestler and their weights?")) return;
    try {
      await api.deleteWrestler(id);
      await load();
    } catch (e) { alert(e.message); }
  };
  
  const toggleMenu = (id) => {
    setMenuOpenId(prev => prev === id ? null : id);
  };
      

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Roster - {school.name || school.code}</h2>
      <div className="bg-gray-800 p-4 rounded mb-6">
        <div className="mb-2"><strong>Add Wrestler</strong></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2">
          <input placeholder="First" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="p-2 w-full sm:w-auto" />
          <input placeholder="Last" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="p-2 w-full sm:w-auto" />
          <input type="number" inputMode="numeric" step="1" placeholder="Weight" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="p-2 w-full sm:w-auto" />
          <select value={newSex} onChange={e => setNewSex(e.target.value)} className="p-2 w-full sm:w-auto">
          <option>Male</option><option>Female</option>
          </select>
          <button onClick={add} disabled={loading} className="bg-purple-600 p-2 text-white rounded w-full sm:w-auto">Add</button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded overflow-x-auto">
        <table className="min-w-full">
          <thead><tr><th>First</th><th>Last</th><th>Weight</th><th>Sex</th><th>Actions</th></tr></thead>
          <tbody>
            {wrestlers.map(w => (
              <tr key={w.id} className="border-t">
                {editingId === w.id ? (
                  <>
                    <td><input value={editFirst} onChange={e => setEditFirst(e.target.value)} className="p-1 bg-gray-700 w-full" /></td>
                    <td><input value={editLast} onChange={e => setEditLast(e.target.value)} className="p-1 bg-gray-700 w-full" /></td>
                    <td><input type="number" inputMode="numeric" step="1" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="p-1 bg-gray-700 w-full" /></td>
                    <td>
                      <select value={editSex} onChange={e => setEditSex(e.target.value)} className="p-1 bg-gray-700 w-full">
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap">
                      <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={cancelEdit} className="bg-gray-600 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{w.firstName}</td>
                    <td>{w.lastName}</td>
                    <td>{w.weightClass}</td>
                    <td>{w.sex}</td>
                    <td className="relative">
                      <button onClick={() => toggleMenu(w.id)} className="px-2 py-1 rounded bg-gray-700">⋮</button>
                      {menuOpenId === w.id && (
                        <div className="absolute z-10 mt-1 right-0 bg-gray-700 rounded shadow p-1">
                          <button onClick={() => startEdit(w)} className="block w-full text-left px-3 py-1 hover:bg-gray-600">Edit</button>
                          <button onClick={() => deleteRow(w.id)} className="block w-full text-left px-3 py-1 hover:bg-gray-600 text-red-300">Delete</button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
