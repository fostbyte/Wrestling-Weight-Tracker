// src/utils/api.js

/**
 * A wrapper for fetch that handles auth, JSON, and errors
 * @param {string} endpoint - The function endpoint (e.g., "wrestlers/get-wrestlers")
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>} - The JSON response from the API
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("lw_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const origin = (typeof window !== 'undefined' && window.location && window.location.port === '3000')
    ? 'http://localhost:8888'
    : '';

  const response = await fetch(`${origin}/.netlify/functions/${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || response.statusText || "API request failed");
  }
  return data;
}

const adminApiFetch = (endpoint, body = {}) => {
  const adminToken = localStorage.getItem("admin_token");
  return apiFetch(endpoint, {
    method: "POST",
    body: { ...body, token: adminToken },
  });
};

const api = {
  login: (code, password) => apiFetch('login', { method: 'POST', body: { login_code: code, password_hash: password } }),
  adminLogin: (username, password) => apiFetch('admin-login', { method: 'POST', body: { username, password } }),
  adminListSchools: () => adminApiFetch('list-schools'),
  createSchool: (name, login_code, password) => adminApiFetch('create-school', { name, login_code, password }),
  deleteSchool: (id) => adminApiFetch('delete-school', { school_id: id }),
};

export default api;
