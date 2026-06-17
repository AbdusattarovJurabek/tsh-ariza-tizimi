import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  exportPDF: (id) => api.get(`/admin/applications/${id}/export/pdf`, { responseType: 'blob' }),
  exportWord: (id) => api.get(`/admin/applications/${id}/export/word`, { responseType: 'blob' }),
  exportAllExcel: () => api.get('/admin/export/applications/excel', { responseType: 'blob' }),
  getStatistics: () => api.get('/admin/statistics'),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  importExcel: (formData) => api.post('/users/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportExcel: () => api.get('/users/export/excel', { responseType: 'blob' }),
};

export const farmerAPI = {
  getAll: () => api.get('/farmers'),
  getOne: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  delete: (id) => api.delete(`/farmers/${id}`),
};

// Login talab qilmaydigan ochiq API
export const publicAPI = {
  trackApplication: (appNumber) => api.get(`/public/track/${encodeURIComponent(appNumber)}`),
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default api;
