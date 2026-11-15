import api from './axiosInstance'

const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getSubAdmins: (params) => api.get('/users/sub-admins', { params }),
  createSubAdmin: (data) => api.post('/users/sub-admins', data),
  deleteSubAdmin: (id) => api.delete(`/users/sub-admins/${id}`),
}

export default userApi
