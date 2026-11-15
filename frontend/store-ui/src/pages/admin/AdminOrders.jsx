import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import orderApi from '../../api/orderApi'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Select, MenuItem, Pagination
} from '@mui/material'
import toast from 'react-hot-toast'

const statusColors = {
  PENDING: 'warning', CONFIRMED: 'info', SHIPPED: 'primary',
  DELIVERED: 'success', CANCELLED: 'error'
}
const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const { data: orders } = useQuery(['admin-orders', page], () =>
    orderApi.getAllOrders({ page, size: 20 }).then(r => r.data.data)
  )

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderApi.updateStatus(orderId, status)
      queryClient.invalidateQueries('admin-orders')
      toast.success('Order status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>All Orders</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order #</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Change Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders?.content?.map(o => (
            <TableRow key={o.id}>
              <TableCell>{o.orderNumber}</TableCell>
              <TableCell>{o.userId}</TableCell>
              <TableCell>₹{o.totalAmount?.toLocaleString()}</TableCell>
              <TableCell>
                <Chip label={o.paymentStatus} variant="outlined" size="small"
                  color={o.paymentStatus === 'PAID' ? 'success' : 'warning'} />
              </TableCell>
              <TableCell>
                <Chip label={o.orderStatus} color={statusColors[o.orderStatus]} size="small" />
              </TableCell>
              <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Select size="small" value={o.orderStatus}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                  {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {orders?.totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={orders.totalPages} page={page + 1}
            onChange={(_, val) => setPage(val - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )
}
