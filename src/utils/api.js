// src/utils/api.js

/**
 * A wrapper for fetch that handles auth, JSON, and errors
 * @param {string} endpoint - The function endpoint (e.g., "wrestlers/get-wrestlers")
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>} - The JSON response from the API
 */
export async function apiFetch(endpoint, options = {}) {
  const origin = (typeof window !== 'undefined' && window.location && window.location.port === '3000')
    ? 'http://localhost:8888'
    : '';

  const buildHeaders = () => {
    const token = localStorage.getItem("lw_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const doFetch = () => fetch(`${origin}/.netlify/functions/${endpoint}`, {
    ...options,
    headers: buildHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let response = await doFetch();
  // Attempt a one-time refresh on 401
  if (response.status === 401) {
    const currentToken = localStorage.getItem("lw_token");
    if (currentToken) {
      try {
        const refreshRes = await fetch(`${origin}/.netlify/functions/refresh-token`, {
          method: 'POST',
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData && refreshData.token) {
            localStorage.setItem('lw_token', refreshData.token);
            localStorage.setItem('lw_token_issued_at', String(Date.now()));
            if (refreshData.school) localStorage.setItem('lw_school', JSON.stringify(refreshData.school));
            // retry original request with new token
            response = await doFetch();
          }
        }
      } catch (e) {
        // swallow and let the normal error flow happen
      }
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  if (!response.ok) {
    throw new Error((data && data.error) || response.statusText || "API request failed");
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
  refreshToken: () => apiFetch('refresh-token', { method: 'POST' }),
  adminListSchools: () => adminApiFetch('list-schools'),
  createSchool: (name, login_code, password) => adminApiFetch('create-school', { name, login_code, password }),
  deleteSchool: (id) => adminApiFetch('delete-school', { school_id: id }),
  updateWrestler: (payload) => apiFetch('update-wrestler', { method: 'POST', body: payload }),
  deleteWrestler: (id) => apiFetch('delete-wrestler', { method: 'POST', body: { id } }),
};

export default api;
