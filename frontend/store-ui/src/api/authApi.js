import api from './axiosInstance'

const authApi = {
  login: (data) => api.post('/auth/login', data),
  initiateRegister: (data) => api.post('/auth/register/initiate', data),
  verifyRegisterOtp: (data) => api.post('/auth/register/verify', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  sendOtp: (phone) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/otp/verify', { phone, otp }),
  googleLogin: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
}

export default authApi
