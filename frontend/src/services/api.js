import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

export const downloadBlob = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  getOne: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  uploadFile: (id, formData) => api.post(`/applications/${id}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (id, fileId) => api.delete(`/applications/${id}/files/${fileId}`),
  exportWord: (id) => api.get(`/applications/${id}/export/word`, { responseType: 'blob' }),
};

export const adminAPI = {
  getApplications: (params) => api.get('/admin/applications', { params }),
  getApplication: (id) => api.get(`/admin/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/applications/${id}/status`, data),
  exportWord: (id) => api.get(`/admin/applications/${id}/export/word`, { responseType: 'blob' }),
  getStatistics: () => api.get('/admin/statistics'),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};

export const farmerAPI = {
  getAll: () => api.get('/farmers'),
  getOne: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  delete: (id) => api.delete(`/farmers/${id}`),
};

export const tasdiqlovchiAPI = {
  getApplications: (params) => api.get('/tasdiqlovchi/applications', { params }),
  getApplication: (id) => api.get(`/tasdiqlovchi/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/tasdiqlovchi/applications/${id}/status`, data),
  updateWordContent: (id, data) => api.put(`/tasdiqlovchi/applications/${id}/word-content`, data),
  saveHtmlContent: (id, html) => api.put(`/tasdiqlovchi/applications/${id}/html-content`, { html }),
  exportWord: (id) => api.get(`/tasdiqlovchi/applications/${id}/word`, { responseType: 'blob' }),
  previewWord: (id) => api.get(`/tasdiqlovchi/applications/${id}/word`, { responseType: 'arraybuffer' }),
  getStatistics: () => api.get('/tasdiqlovchi/statistics'),
};

export const imzolovchiAPI = {
  getApplications: (params) => api.get('/imzolovchi/applications', { params }),
  getApplication: (id) => api.get(`/imzolovchi/applications/${id}`),
  sign: (id) => api.post(`/imzolovchi/applications/${id}/sign`),
  exportWord: (id) => api.get(`/imzolovchi/applications/${id}/word`, { responseType: 'blob' }),
  previewWord: (id) => api.get(`/imzolovchi/applications/${id}/word`, { responseType: 'arraybuffer' }),
};

export const publicAPI = {
  track: (appNumber) => api.get(`/public/track/${appNumber}`),
};

export default api;
