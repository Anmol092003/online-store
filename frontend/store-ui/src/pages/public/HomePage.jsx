import { useQuery } from 'react-query'
import productApi from '../../api/productApi'
import ProductCard from '../../components/products/ProductCard'
import { Box, Typography, Grid, Chip, CircularProgress, Paper } from '@mui/material'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { data: products, isLoading } = useQuery('home-products', () =>
    productApi.getAll({ page: 0, size: 8 }).then(r => r.data.data)
  )

  return (
    <Box>
      {/* Hero Banner */}
      <Paper sx={{
        background: 'linear-gradient(135deg, #464feb 0%, #7c3aed 100%)',
        color: '#fff', p: 6, borderRadius: 3, mb: 4, textAlign: 'center'
      }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Welcome to ShopEase
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
          Discover thousands of products at amazing prices
        </Typography>
        <Chip label="Shop Now →" component={Link} to="/products" clickable
          sx={{ bgcolor: '#fff', color: '#464feb', fontWeight: 700, fontSize: 16, px: 2, py: 3 }} />
      </Paper>

      {/* Featured Products */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Featured Products</Typography>
          <Link to="/products" style={{ color: '#464feb', fontWeight: 600 }}>View All →</Link>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={3}>
            {products?.content?.map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  )
}
