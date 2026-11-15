import api from './axiosInstance'

const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  createSubcategory: (categoryId, data) => api.post(`/categories/${categoryId}/subcategories`, data),
  deleteSubcategory: (id) => api.delete(`/categories/subcategories/${id}`),
}

export default categoryApi
