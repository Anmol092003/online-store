import api from './axiosInstance'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const paymentApi = {
  initiate: (payload) => api.post('/payments/initiate', payload),
  verify: (payload) => api.post('/payments/verify', payload),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
}

export default paymentApi
