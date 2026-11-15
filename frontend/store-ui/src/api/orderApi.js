import api from './axiosInstance'

const orderApi = {
  placeOrder: (addressId, paymentMethod) => api.post('/orders', { addressId, paymentMethod }),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getMyOrders: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getAllOrders: (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}

export default orderApi
