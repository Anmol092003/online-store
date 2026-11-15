import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import ProductCard from '../../components/products/ProductCard'
import { Box, Typography, Grid, CircularProgress } from '@mui/material'

export default function CategoryPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const subId = searchParams.get('sub')

  const { data: category } = useQuery(['category', id], () =>
    categoryApi.getById(id).then(r => r.data.data)
  )
  const { data: products, isLoading } = useQuery(['category-products', id], () =>
    productApi.getByCategory(id, { page: 0, size: 20 }).then(r => r.data.data)
  )

  const subcategory = subId && category?.subcategories?.find(s => String(s.id) === subId)
  const filteredProducts = subId
    ? products?.content?.filter(p => String(p.subcategoryId) === subId)
    : products?.content

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        {subcategory ? subcategory.name : (category?.name || 'Category')}
      </Typography>
      {isLoading ? <CircularProgress /> : (
        <Grid container spacing={3}>
          {filteredProducts?.map(p => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
