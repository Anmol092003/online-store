import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Rating, Box, Chip
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import toast from 'react-hot-toast'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    try {
      await dispatch(addToCart({ productId: product.id, quantity: 1 })).unwrap()
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err || 'Failed to add to cart')
    }
  }

  const displayPrice = product.discountPrice || product.price
  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0

  return (
    <Card className="product-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s ease', cursor: 'pointer' }}>
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', flexGrow: 1 }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={product.imageUrl || '/placeholder.png'}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          {hasDiscount && (
            <Chip label={`-${discountPct}%`} color="error" size="small"
              sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700 }} />
          )}
          {product.stockQuantity === 0 && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="white" fontWeight={700}>Out of Stock</Typography>
            </Box>
          )}
        </Box>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>{product.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="h6" color="primary" fontWeight={700}>
              ₹{displayPrice?.toLocaleString()}
            </Typography>
            {hasDiscount && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ₹{product.price?.toLocaleString()}
              </Typography>
            )}
          </Box>
          {product.averageRating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Rating value={product.averageRating} readOnly size="small" precision={0.5} />
              <Typography variant="caption" color="text.secondary">
                ({product.reviewCount})
              </Typography>
            </Box>
          )}
        </CardContent>
      </Link>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={product.stockQuantity === 0}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  )
}
