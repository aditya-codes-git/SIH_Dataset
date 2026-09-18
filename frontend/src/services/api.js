const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const getHeaders = (customHeaders = {}, roleParam = null) => {
  const role = roleParam || localStorage.getItem('retinoscan_demo_role') || 'operator';
  return {
    'x-demo-role': role,
    ...customHeaders,
  };
};

export const api = {
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  createScreening: async (formData, role = null) => {
    const res = await fetch(`${BASE_URL}/screenings`, {
      method: 'POST',
      headers: getHeaders({}, role),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit image for screening');
    return data;
  },

  getScreenings: async (role = null) => {
    const headers = getHeaders({}, role);
    const url = `${BASE_URL}/screenings`;
    const currentRole = headers['x-demo-role'];

    console.log("[SCREENINGS REQUEST]", {
      url,
      method: 'GET',
      role: currentRole,
      headers
    });
    console.log("[SCREENINGS] START");

    try {
      const res = await fetch(url, { headers });
      console.log("[SCREENINGS] SUCCESS", res.status);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch screenings');
      return data;
    } catch (error) {
      console.log("[SCREENINGS] ERROR", error);
      throw error;
    }
  },

  getScreeningById: async (id, role = null) => {
    const res = await fetch(`${BASE_URL}/screenings/${id}`, { headers: getHeaders({}, role) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch screening details');
    return data;
  },

  submitReview: async (id, reviewData, role = null) => {
    const res = await fetch(`${BASE_URL}/screenings/${id}/review`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }, role),
      body: JSON.stringify(reviewData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review');
    return data;
  },

  explainScreening: async (payload, role = null) => {
    const res = await fetch(`${BASE_URL}/agent/explain`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }, role),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate explanation');
    return data;
  },

  chatWithAgent: async (payload, role = null) => {
    const res = await fetch(`${BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }, role),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to communicate with AI agent');
    return data;
  },

  getFileUrl: (path, roleParam = null) => {
    if (!path) return '';
    const role = roleParam || localStorage.getItem('retinoscan_demo_role') || 'operator';
    if (path.startsWith('http')) {
      return path.includes('role=') ? path : `${path}${path.includes('?') ? '&' : '?'}role=${role}`;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const separator = cleanPath.includes('?') ? '&' : '?';
    return `http://127.0.0.1:5000${cleanPath}${separator}role=${role}`;
  }
};
