import { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../api/axiosInstance'
import orderApi from '../../api/orderApi'
import paymentApi, { loadRazorpayScript } from '../../api/paymentApi'
import {
  Box, Typography, Paper, Grid, Button, Radio, RadioGroup,
  FormControlLabel, Divider, CircularProgress, Alert
} from '@mui/material'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart } = useSelector((s) => s.cart)
  const { user } = useSelector((s) => s.auth)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [placing, setPlacing] = useState(false)

  const { data: addresses } = useQuery('addresses', () =>
    api.get('/addresses').then(r => r.data.data)
  )

  const openRazorpay = (order, payment) =>
    new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: payment.clientKey,
        // Razorpay works in the smallest currency unit (paise)
        amount: Math.round(Number(payment.amount) * 100),
        currency: payment.currency,
        order_id: payment.providerOrderId,
        name: 'E-Commerce Store',
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#464feb' },
        handler: resolve,
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      })
      rzp.on('payment.failed', (res) => reject(new Error(res.error?.description || 'Payment failed')))
      rzp.open()
    })

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }
    setPlacing(true)
    try {
      const { data: orderRes } = await orderApi.placeOrder(selectedAddress, paymentMethod)
      const order = orderRes.data

      if (paymentMethod === 'COD') {
        toast.success('Order confirmed!')
        navigate(`/orders/${order.id}`)
        return
      }

      if (!(await loadRazorpayScript())) {
        await orderApi.cancelOrder(order.id)
        throw new Error('Could not load Razorpay checkout')
      }

      const { data: payment } = await paymentApi.initiate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        amount: order.totalAmount,
        currency: 'INR',
      })

      try {
        const result = await openRazorpay(order, payment)
        await paymentApi.verify({
          razorpay_order_id: result.razorpay_order_id,
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_signature: result.razorpay_signature,
        })
        toast.success('Payment successful!')
      } catch (paymentErr) {
        await orderApi.cancelOrder(order.id)
        toast.error(`${paymentErr.message}. Order cancelled.`)
      }
      navigate(`/orders/${order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Checkout</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Delivery Address</Typography>
            {addresses?.length === 0 && (
              <Alert severity="warning">Please add an address first</Alert>
            )}
            <RadioGroup value={selectedAddress} onChange={(e) => setSelectedAddress(Number(e.target.value))}>
              {addresses?.map(addr => (
                <FormControlLabel key={addr.id} value={addr.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography fontWeight={600}>{addr.fullName} – {addr.phone}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {addr.houseNumber}, {addr.street}, {addr.city}, {addr.state} – {addr.zipCode}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate('/addresses')}>
              + Add New Address
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Order Summary</Typography>
            {cart?.items?.map(item => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography noWrap sx={{ maxWidth: 200 }}>{item.productName} x{item.quantity}</Typography>
                <Typography>₹{item.totalPrice?.toLocaleString()}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                ₹{cart?.totalAmount?.toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Payment method</Typography>
            <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ mb: 2 }}>
              <FormControlLabel value="ONLINE" control={<Radio />} label="Online payment" />
              <FormControlLabel value="COD" control={<Radio />} label="Cash on delivery" />
            </RadioGroup>
            <Button variant="contained" fullWidth size="large"
              onClick={handlePlaceOrder} disabled={placing}>
              {placing ? <CircularProgress size={24} /> : paymentMethod === 'COD'
                ? 'Place order'
                : `Pay ₹${cart?.totalAmount?.toLocaleString() ?? ''}`}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
