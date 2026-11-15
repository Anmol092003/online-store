import { useSelector, useDispatch } from 'react-redux'
import { removeFromCart, fetchCart } from '../../store/slices/cartSlice'
import {
  Box, Typography, Button, Paper, Grid, Divider,
  IconButton, TextField, CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import cartApi from '../../api/cartApi'
import toast from 'react-hot-toast'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { cart } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user) dispatch(fetchCart())
  }, [user])

  if (!user) return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h5" mb={2}>Please login to view your cart</Typography>
      <Button variant="contained" component={Link} to="/login">Login</Button>
    </Box>
  )

  if (!cart || cart.items?.length === 0) return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h5" mb={2}>Your cart is empty</Typography>
      <Button variant="contained" component={Link} to="/products">Continue Shopping</Button>
    </Box>
  )

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap()
      toast.success('Item removed')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleQuantityChange = async (itemId, qty) => {
    try {
      await cartApi.updateItem(itemId, qty)
      dispatch(fetchCart())
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Shopping Cart</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cart.items.map((item) => (
            <Paper key={item.id} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box component="img" src={item.productImageUrl || '/placeholder.png'}
                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }} />
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{item.productName}</Typography>
                <Typography color="primary" fontWeight={700}>₹{item.unitPrice?.toLocaleString()}</Typography>
              </Box>
              <TextField type="number" size="small" value={item.quantity}
                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                inputProps={{ min: 1 }} sx={{ width: 70 }} />
              <Typography fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                ₹{item.totalPrice?.toLocaleString()}
              </Typography>
              <IconButton color="error" onClick={() => handleRemove(item.id)}>
                <DeleteIcon />
              </IconButton>
            </Paper>
          ))}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Order Summary</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Items ({cart.totalItems})</Typography>
              <Typography>₹{cart.totalAmount?.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Delivery</Typography>
              <Typography color="success.main">FREE</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                ₹{cart.totalAmount?.toLocaleString()}
              </Typography>
            </Box>
            <Button variant="contained" fullWidth size="large"
              onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
