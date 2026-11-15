import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import productApi from '../../api/productApi'
import ProductCard from '../../components/products/ProductCard'
import { Box, Typography, Grid, CircularProgress } from '@mui/material'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const { data, isLoading } = useQuery(['search', q], () =>
    productApi.search(q, { page: 0, size: 20 }).then(r => r.data.data),
    { enabled: q.length > 0 }
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Search results for: <em>"{q}"</em>
        {data && <span style={{ fontWeight: 400, fontSize: 16, marginLeft: 8 }}>
          ({data.totalElements} results)
        </span>}
      </Typography>
      {isLoading && <CircularProgress />}
      <Grid container spacing={3}>
        {data?.content?.map(product => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      {data?.content?.length === 0 && (
        <Typography color="text.secondary" mt={4}>No products found.</Typography>
      )}
    </Box>
  )
}
