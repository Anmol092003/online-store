import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Box, Typography, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, Grid, Pagination
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [imageFile, setImageFile] = useState(null)
  const [newSubOpen, setNewSubOpen] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubDesc, setNewSubDesc] = useState('')

  const { data: products } = useQuery(['admin-products', page], () =>
    productApi.getAll({ page, size: 10 }).then(r => r.data.data)
  )
  const { data: categories } = useQuery('categories', () =>
    categoryApi.getAll().then(r => r.data.data)
  )

  const formik = useFormik({
    initialValues: { name: '', description: '', price: '', discountPrice: '', stockQuantity: '', sku: '', categoryId: '', subcategoryId: '' },
    validationSchema: Yup.object({
      name: Yup.string().required(), price: Yup.number().min(0.01).required(),
      stockQuantity: Yup.number().min(0).required(), categoryId: Yup.string().required(),
    }),
    onSubmit: async (values, { resetForm }) => {
      const formData = new FormData()
      const productBlob = new Blob([JSON.stringify(values)], { type: 'application/json' })
      formData.append('product', productBlob)
      if (imageFile) formData.append('image', imageFile)
      try {
        await productApi.create(formData)
        queryClient.invalidateQueries('admin-products')
        toast.success('Product created')
        setOpen(false)
        resetForm()
        setImageFile(null)
      } catch {
        toast.error('Failed to create product')
      }
    },
  })

  const selectedCategory = categories?.find(c => c.id === formik.values.categoryId)

  const handleCreateSubcategory = async () => {
    if (!newSubName.trim() || !formik.values.categoryId) return
    try {
      const res = await categoryApi.createSubcategory(formik.values.categoryId, { name: newSubName, description: newSubDesc })
      await queryClient.invalidateQueries('categories')
      formik.setFieldValue('subcategoryId', res.data.data.id)
      toast.success('Subcategory created')
      setNewSubOpen(false)
      setNewSubName(''); setNewSubDesc('')
    } catch {
      toast.error('Failed to create subcategory')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await productApi.delete(id)
      queryClient.invalidateQueries('admin-products')
      toast.success('Product deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleAdjustStock = async (id, delta) => {
    try {
      await productApi.adjustStock(id, delta)
      queryClient.invalidateQueries('admin-products')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Product</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products?.content?.map(p => (
            <TableRow key={p.id}>
              <TableCell>
                <Box component="img" src={p.imageUrl || '/placeholder.png'}
                  sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }} />
              </TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>₹{p.discountPrice || p.price}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => handleAdjustStock(p.id, -1)}
                    disabled={p.stockQuantity === 0} aria-label="Decrease stock">
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 28, textAlign: 'center' }}>{p.stockQuantity}</Typography>
                  <IconButton size="small" color="primary" onClick={() => handleAdjustStock(p.id, 1)}
                    aria-label="Increase stock">
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Chip label={p.status} color={p.status === 'ACTIVE' ? 'success' : 'default'} size="small" />
              </TableCell>
              <TableCell>
                <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {products?.totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={products.totalPages} page={page + 1}
            onChange={(_, val) => setPage(val - 1)} color="primary" />
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Name" name="name" value={formik.values.name}
                  onChange={formik.handleChange} error={formik.touched.name && Boolean(formik.errors.name)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Description" name="description"
                  value={formik.values.description} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Price" name="price"
                  value={formik.values.price} onChange={formik.handleChange}
                  error={formik.touched.price && Boolean(formik.errors.price)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Discount Price" name="discountPrice"
                  value={formik.values.discountPrice} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Stock" name="stockQuantity"
                  value={formik.values.stockQuantity} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="SKU" name="sku" value={formik.values.sku} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="categoryId"
                    value={formik.values.categoryId}
                    onChange={(e) => {
                      formik.setFieldValue('categoryId', e.target.value)
                      formik.setFieldValue('subcategoryId', '')
                    }}
                    label="Category"
                  >
                    {categories?.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!formik.values.categoryId}>
                  <InputLabel>Subcategory (optional)</InputLabel>
                  <Select name="subcategoryId" value={formik.values.subcategoryId} onChange={formik.handleChange} label="Subcategory (optional)">
                    <MenuItem value="">None</MenuItem>
                    {selectedCategory?.subcategories?.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={!formik.values.categoryId}
                  onClick={() => setNewSubOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Add New Subcategory
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label" fullWidth>
                  Upload Product Image
                  <input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files[0])} />
                </Button>
                {imageFile && <Typography variant="caption" sx={{ mt: 1 }}>{imageFile.name}</Typography>}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={newSubOpen} onClose={() => setNewSubOpen(false)}>
        <DialogTitle>Add Subcategory to {selectedCategory?.name}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description (optional)" value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSubOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubcategory}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
