import { useQuery } from 'react-query'
import productApi from '../../api/productApi'
import ProductCard from '../../components/products/ProductCard'
import { Grid, Typography, CircularProgress, Box, Pagination } from '@mui/material'
import { useState } from 'react'

export default function ProductListPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useQuery(['products', page], () =>
    productApi.getAll({ page, size: 12 }).then(r => r.data.data)
  )

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>All Products</Typography>
      <Grid container spacing={3}>
        {data?.content?.map(product => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      {data?.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={data.totalPages}
            page={page + 1}
            onChange={(_, val) => setPage(val - 1)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}
