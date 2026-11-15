import api from './axiosInstance'

const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  search: (q, params) => api.get('/products/search', { params: { q, ...params } }),
  create: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adjustStock: (id, delta) => api.patch(`/products/${id}/stock`, { delta }),
  delete: (id) => api.delete(`/products/${id}`),
}

export default productApi
