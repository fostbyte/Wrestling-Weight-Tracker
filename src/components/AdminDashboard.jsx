import { useState, useEffect } from "react";
import api from "../utils/api";

export default function AdminDashboard({ onLogout }) {
  const [schools, setSchools] = useState([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newPass, setNewPass] = useState("");

  const load = async () => {
    const data = await api.adminListSchools();
    setSchools(data);
  };

  useEffect(() => { load(); }, []);

  const addSchool = async () => {
    await api.createSchool(newName, newCode, newPass);
    load();
  };

  const removeSchool = async (id) => {
    await api.deleteSchool(id);
    load();
  };

  return (
    <div>
      <h1>Admin Panel</h1>

      <h2>Create School</h2>
      <input placeholder="School Name" value={newName} onChange={e => setNewName(e.target.value)} />
      <input placeholder="Login Code" value={newCode} onChange={e => setNewCode(e.target.value)} />
      <input placeholder="Password" value={newPass} onChange={e => setNewPass(e.target.value)} />
      <button onClick={addSchool}>Create</button>

      <h2>Existing Schools</h2>
      <ul>
        {schools.map(s => (
          <li key={s.id}>
            {s.name} ({s.login_code})
            <button onClick={() => removeSchool(s.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={onLogout}>Logout</button>
    </div>
  );
}
