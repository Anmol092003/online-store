import { useQuery, useQueryClient } from 'react-query'
import api from '../../api/axiosInstance'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Avatar
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { data: users } = useQuery('admin-users-list', () =>
    api.get('/users', { params: { size: 50 } }).then(r => r.data.data?.content)
  )

  const toggleStatus = async (userId) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`)
      queryClient.invalidateQueries('admin-users-list')
      toast.success('User status updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Users</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users?.map(u => (
            <TableRow key={u.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#464feb', fontSize: 14 }}>
                    {u.firstName?.[0]}
                  </Avatar>
                  {u.firstName} {u.lastName}
                </Box>
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone || '-'}</TableCell>
              <TableCell>
                <Chip label={u.role === 'ROLE_ADMIN' ? 'Admin' : u.role === 'ROLE_SUB_ADMIN' ? 'Sub Admin' : 'User'}
                  color={u.role === 'ROLE_ADMIN' ? 'error' : u.role === 'ROLE_SUB_ADMIN' ? 'warning' : 'default'} size="small" />
              </TableCell>
              <TableCell>
                <Chip label={u.enabled ? 'Active' : 'Blocked'}
                  color={u.enabled ? 'success' : 'error'} size="small" />
              </TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => toggleStatus(u.id)}
                  color={u.enabled ? 'error' : 'success'}>
                  {u.enabled ? <BlockIcon /> : <CheckCircleIcon />}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
