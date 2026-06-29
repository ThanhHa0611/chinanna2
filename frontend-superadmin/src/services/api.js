const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('superadmin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(', ')
      : detail || data.message || `Có lỗi xảy ra (HTTP ${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function documentFileUrl(menteeId, docId) {
  return `${API_BASE}/api/superadmin/mentees/${menteeId}/documents/${docId}/file`;
}

export const api = {
  login: (body) =>
    request('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request('/api/admin/auth/me'),

  logout: () => request('/api/admin/auth/logout', { method: 'POST' }),

  getMentors: () => request('/api/superadmin/mentors'),

  getMentorActivities: (adminId) =>
    request(`/api/superadmin/mentors/${encodeURIComponent(adminId)}/activities`),

  getMentees: () => request('/api/superadmin/mentees'),

  getMentee: (id) => request(`/api/superadmin/mentees/${id}`),

  getMenteeFeedback: (id) => request(`/api/superadmin/mentees/${id}/feedback`),

  getAccessRequests: () => request('/api/superadmin/access-requests'),

  reviewAccessRequest: (id, body) =>
    request(`/api/superadmin/access-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
