import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import userApi from '../../api/userApi'
import {
  Box, Typography, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import toast from 'react-hot-toast'

export default function AdminSubAdmins() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const { data: subAdmins } = useQuery('admin-sub-admins-list', () =>
    userApi.getSubAdmins({ size: 50 }).then(r => r.data.data?.content)
  )

  const handleCreate = async () => {
    if (!phone.trim() || !password.trim()) {
      toast.error('Phone number and password are required')
      return
    }
    try {
      await userApi.createSubAdmin({ phone, password })
      queryClient.invalidateQueries('admin-sub-admins-list')
      toast.success('Sub-admin created')
      setOpen(false)
      setPhone('')
      setPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sub-admin')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this sub-admin?')) return
    try {
      await userApi.deleteSubAdmin(id)
      queryClient.invalidateQueries('admin-sub-admins-list')
      toast.success('Sub-admin removed')
    } catch {
      toast.error('Failed to remove sub-admin')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Sub Admins</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Sub Admin</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subAdmins?.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.phone}</TableCell>
              <TableCell>
                <Chip label={u.enabled ? 'Active' : 'Blocked'}
                  color={u.enabled ? 'success' : 'error'} size="small" />
              </TableCell>
              <TableCell>
                <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Sub Admin</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
