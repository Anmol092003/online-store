import { useQuery } from 'react-query'
import orderApi from '../../api/orderApi'
import { Box, Typography, Paper, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Link } from 'react-router-dom'

const statusColors = {
  PENDING: 'warning', CONFIRMED: 'info', SHIPPED: 'primary',
  DELIVERED: 'success', CANCELLED: 'error'
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery('my-orders', () =>
    orderApi.getMyOrders({ page: 0, size: 20 }).then(r => r.data.data)
  )

  if (isLoading) return <Typography>Loading orders...</Typography>

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>My Orders</Typography>
      {data?.content?.length === 0 && (
        <Typography color="text.secondary">No orders placed yet.</Typography>
      )}
      {data?.content?.map(order => (
        <Paper key={order.id} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography fontWeight={700}>{order.orderNumber}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={order.orderStatus} color={statusColors[order.orderStatus]} size="small" />
              <Chip label={order.paymentStatus} variant="outlined" size="small" />
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {order.items?.length} item(s) · Total: ₹{order.totalAmount?.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(order.createdAt).toLocaleDateString()}
          </Typography>
          <Box>
            <Link to={`/orders/${order.id}`} style={{ color: '#464feb', fontSize: 14 }}>
              View Details →
            </Link>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}
