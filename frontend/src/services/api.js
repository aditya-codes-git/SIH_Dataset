const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

  getPendingReviews: async (role = null) => {
    const res = await fetch(`${BASE_URL}/screenings/pending-reviews`, { headers: getHeaders({}, role || 'doctor') });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch pending reviews');
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

  getFileUrl: (filePath, roleParam = null) => {
    if (!filePath) return '';
    const role = roleParam || localStorage.getItem('retinoscan_demo_role') || 'operator';

    // Normalize direct localhost:5000 URLs to relative paths so they route through proxy/tunnel
    let cleanPath = filePath.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, '');
    if (cleanPath.startsWith('http')) {
      return cleanPath.includes('role=') ? cleanPath : `${cleanPath}${cleanPath.includes('?') ? '&' : '?'}role=${role}`;
    }

    // If it's a full filesystem path or basename from results
    if (cleanPath.includes('\\') || cleanPath.includes('/')) {
      const parts = cleanPath.split(/[\\/]/);
      const filename = parts[parts.length - 1];
      if (cleanPath.includes('results')) {
        cleanPath = `/api/files/results/${filename}`;
      } else if (cleanPath.includes('gradcam')) {
        cleanPath = `/api/files/gradcam/${filename}`;
      } else if (cleanPath.includes('original')) {
        cleanPath = `/api/files/original/${filename}`;
      }
    }

    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
    const separator = cleanPath.includes('?') ? '&' : '?';
    const apiHost = BASE_URL.startsWith('http') ? BASE_URL.replace(/\/api\/?$/, '') : '';
    return `${apiHost}${cleanPath}${separator}role=${role}`;
  }
};
