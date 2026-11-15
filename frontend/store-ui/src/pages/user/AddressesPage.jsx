import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import api from '../../api/axiosInstance'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControlLabel, Checkbox, Grid, IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import toast from 'react-hot-toast'

const schema = Yup.object({
  fullName: Yup.string().required(), phone: Yup.string().required(),
  city: Yup.string().required(), state: Yup.string().required(),
  country: Yup.string().required(), zipCode: Yup.string().required(),
})

export default function AddressesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: addresses } = useQuery('addresses', () =>
    api.get('/addresses').then(r => r.data.data)
  )

  const formik = useFormik({
    initialValues: { fullName: '', phone: '', houseNumber: '', street: '', city: '', state: '', country: 'India', zipCode: '', defaultAddress: false },
    validationSchema: schema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await api.post('/addresses', values)
        queryClient.invalidateQueries('addresses')
        toast.success('Address added')
        setOpen(false)
        resetForm()
      } catch {
        toast.error('Failed to add address')
      }
    },
  })

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`)
      queryClient.invalidateQueries('addresses')
      toast.success('Address deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>My Addresses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Address
        </Button>
      </Box>

      <Grid container spacing={2}>
        {addresses?.map(addr => (
          <Grid item xs={12} sm={6} md={4} key={addr.id}>
            <Paper sx={{ p: 2, border: addr.defaultAddress ? '2px solid #464feb' : 'none' }}>
              {addr.defaultAddress && (
                <Typography variant="caption" color="primary" fontWeight={700}>Default</Typography>
              )}
              <Typography fontWeight={600}>{addr.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {addr.houseNumber}, {addr.street}, {addr.city}, {addr.state} – {addr.zipCode}
              </Typography>
              <Typography variant="body2">{addr.phone}</Typography>
              <IconButton size="small" color="error" onClick={() => deleteAddress(addr.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Address</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              {[['fullName', 'Full Name'], ['phone', 'Phone'], ['houseNumber', 'House No.'], ['street', 'Street'], ['city', 'City'], ['state', 'State'], ['country', 'Country'], ['zipCode', 'ZIP Code']].map(([name, label]) => (
                <Grid item xs={6} key={name}>
                  <TextField fullWidth size="small" label={label} name={name}
                    value={formik.values[name]} onChange={formik.handleChange}
                    error={formik.touched[name] && Boolean(formik.errors[name])} />
                </Grid>
              ))}
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox name="defaultAddress" checked={formik.values.defaultAddress} onChange={formik.handleChange} />}
                  label="Set as default address"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Address</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
