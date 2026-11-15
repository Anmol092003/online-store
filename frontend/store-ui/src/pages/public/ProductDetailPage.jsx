import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import productApi from '../../api/productApi'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import toast from 'react-hot-toast'
import {
  Box, Grid, Typography, Button, Rating, Chip, Divider,
  CircularProgress, Paper, Breadcrumbs, TextField
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { useState } from 'react'

export default function ProductDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery(['product', id], () =>
    productApi.getById(id).then(r => r.data.data)
  )

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
  if (!product) return <Typography>Product not found</Typography>

  const displayPrice = product.discountPrice || product.price

  const handleAddToCart = async () => {
    try {
      await dispatch(addToCart({ productId: product.id, quantity })).unwrap()
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err || 'Please login to add to cart')
    }
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Box component="img"
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              sx={{ width: '100%', borderRadius: 2, maxHeight: 450, objectFit: 'cover' }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h4" fontWeight={700}>{product.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
              <Rating value={product.averageRating || 0} readOnly precision={0.5} />
              <Typography color="text.secondary">({product.reviewCount || 0} reviews)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, my: 2 }}>
              <Typography variant="h4" color="primary" fontWeight={700}>
                ₹{displayPrice?.toLocaleString()}
              </Typography>
              {product.discountPrice && (
                <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  ₹{product.price?.toLocaleString()}
                </Typography>
              )}
            </Box>

            <Chip label={product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
              color={product.stockQuantity > 0 ? 'success' : 'error'} sx={{ mb: 2 }} />

            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <TextField
                type="number"
                label="Qty"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: product.stockQuantity }}
                sx={{ width: 80 }}
                size="small"
              />
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                sx={{ flex: 1 }}
              >
                Add to Cart
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              SKU: {product.sku}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
