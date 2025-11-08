// src/utils/api.js
// small wrapper to call Netlify functions with JWT in Authorization header
export const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("lw_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`/.netlify/functions/${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "API error");
  return data;
};
