import { useQuery } from 'react-query'
import { Grid, Paper, Typography, Box } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import CategoryIcon from '@mui/icons-material/Category'
import api from '../../api/axiosInstance'

function StatCard({ title, icon, color, value }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, borderLeft: `4px solid ${color}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color={color}>{value ?? '—'}</Typography>
          <Typography color="text.secondary">{title}</Typography>
        </Box>
        <Box sx={{ color, opacity: 0.3, fontSize: 48 }}>{icon}</Box>
      </Box>
    </Paper>
  )
}

export default function AdminDashboard() {
  const { data: users } = useQuery('admin-users', () =>
    api.get('/users', { params: { size: 1 } }).then(r => r.data.data?.totalElements)
  )
  const { data: products } = useQuery('admin-products-count', () =>
    api.get('/products', { params: { size: 1 } }).then(r => r.data.data?.totalElements)
  )
  const { data: orders } = useQuery('admin-orders-count', () =>
    api.get('/orders/admin/all', { params: { size: 1 } }).then(r => r.data.data?.totalElements)
  )
  const { data: categories } = useQuery('admin-cats', () =>
    api.get('/categories').then(r => r.data.data?.length)
  )

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={4}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Users" icon={<PeopleIcon fontSize="inherit" />} color="#464feb" value={users} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Products" icon={<InventoryIcon fontSize="inherit" />} color="#ff6b35" value={products} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Orders" icon={<ShoppingBagIcon fontSize="inherit" />} color="#7c3aed" value={orders} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Categories" icon={<CategoryIcon fontSize="inherit" />} color="#10b981" value={categories} />
        </Grid>
      </Grid>
    </Box>
  )
}
