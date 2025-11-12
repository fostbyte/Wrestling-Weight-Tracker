
// src/components/WrestlerList.jsx
import React, { useEffect, useState, useContext } from "react";
import api, { apiFetch } from "../utils/api";
import { SchoolContext } from "../context/SchoolContext";
import { useNotify } from "../context/NotifyContext";
import { useWrestlers } from "../context/WrestlersContext";

export default function WrestlerList() {
  const { school } = useContext(SchoolContext);
  const { notify, confirm } = useNotify();
  const { wrestlers, ensureLoaded, refresh } = useWrestlers();
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newSex, setNewSex] = useState("Male");
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editSex, setEditSex] = useState("Male");
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState("first"); // first | last | weight

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const add = async () => {
    setLoading(true);
    try {
      await apiFetch("add-wrestlers", { method: "POST", body: { firstName: newFirstName, lastName: newLastName, weightClass: newWeight, sex: newSex } });
      setNewFirstName(""); setNewLastName(""); setNewWeight("");
      await refresh();
    } catch (e) { notify(e.message, "error"); }
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
      await refresh();
    } catch (e) { notify(e.message, "error"); }
  };

  const deleteRow = async (id) => {
    setMenuOpenId(null);
    setDeletingId(id);
    const ok = await confirm("Delete this wrestler and their weights?");
    if (!ok) {
      setDeletingId(null);
      return;
    }
    try {
      await api.deleteWrestler(id);
      await refresh();
    } catch (e) { notify(e.message, "error"); }
    setDeletingId(null);
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

      {/* Filter input above the cards */}
      <div className="bg-gray-800 p-4 rounded mb-3">
        <input
          placeholder="Filter by name or weight class"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="w-full p-2 bg-gray-700"
        />
      </div>
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
      {/* Scrollable, responsive cards */}
      <div className="bg-gray-800 p-4 rounded max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
              <div
                key={w.id}
                className={
                  `relative rounded p-2 sm:p-4 transition-colors ring-offset-2 ` +
                  (editingId === w.id
                    ? `bg-blue-700 ring-2 ring-blue-400 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2`
                    : deletingId === w.id
                      ? `bg-red-700 ring-2 ring-red-400`
                      : `bg-gray-700`)
                }
              >
                {editingId === w.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input value={editFirst} onChange={e => setEditFirst(e.target.value)} className="p-2 bg-gray-600 flex-1 text-sm sm:text-base" placeholder="First" />
                      <input value={editLast} onChange={e => setEditLast(e.target.value)} className="p-2 bg-gray-600 flex-1 text-sm sm:text-base" placeholder="Last" />
                    </div>
                    <div className="flex gap-2">
                      <input type="number" inputMode="numeric" step="1" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="p-2 bg-gray-600 flex-1 text-sm sm:text-base" placeholder="Weight" />
                      <select value={editSex} onChange={e => setEditSex(e.target.value)} className="p-2 bg-gray-600 text-sm sm:text-base">
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded flex-1">Save</button>
                      <button onClick={cancelEdit} className="bg-gray-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded flex-1">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-base sm:text-lg font-semibold">{w.firstName} {w.lastName}</div>
                    <div className="text-xs sm:text-sm text-gray-300 mt-1">Weight Class: {w.weightClass || "-"}</div>
                    <div className="text-xs sm:text-sm text-gray-300">Sex: {w.sex || "-"}</div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEdit(w)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 sm:px-3 sm:py-2 rounded">Edit</button>
                      <button onClick={() => deleteRow(w.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 sm:px-3 sm:py-2 rounded">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
