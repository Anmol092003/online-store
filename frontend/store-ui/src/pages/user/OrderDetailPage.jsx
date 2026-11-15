import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import orderApi from '../../api/orderApi'
import { Box, Typography, Paper, Chip, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { data: order, isLoading } = useQuery(['order', id], () =>
    orderApi.getById(id).then(r => r.data.data)
  )

  if (isLoading) return <Typography>Loading...</Typography>
  if (!order) return <Typography>Order not found</Typography>

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Order Details</Typography>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{order.orderNumber}</Typography>
          <Chip label={order.orderStatus} color="primary" />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Placed on: {new Date(order.createdAt).toLocaleString()}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="center">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items?.map((item) => (
              <TableRow key={item.productId}>
                <TableCell>{item.productName}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">₹{item.unitPrice?.toLocaleString()}</TableCell>
                <TableCell align="right">₹{item.totalPrice?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
              <TableCell align="right">
                <strong>₹{order.totalAmount?.toLocaleString()}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
