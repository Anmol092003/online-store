import { Fragment, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import categoryApi from '../../api/categoryApi'
import {
  Box, Typography, Button, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, Collapse
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import toast from 'react-hot-toast'

export default function AdminCategories() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [subOpen, setSubOpen] = useState(false)
  const [subCategoryId, setSubCategoryId] = useState(null)
  const [subName, setSubName] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [expanded, setExpanded] = useState([])

  const toggleExpanded = (id) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const { data: categories } = useQuery('categories', () =>
    categoryApi.getAll().then(r => r.data.data)
  )

  const handleCreate = async () => {
    try {
      await categoryApi.create({ name, description: desc })
      queryClient.invalidateQueries('categories')
      toast.success('Category created')
      setOpen(false)
      setName(''); setDesc('')
    } catch {
      toast.error('Failed to create category')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await categoryApi.delete(id)
      queryClient.invalidateQueries('categories')
      toast.success('Category deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const openSubDialog = (categoryId) => {
    setSubCategoryId(categoryId)
    setSubName(''); setSubDesc('')
    setSubOpen(true)
  }

  const handleCreateSubcategory = async () => {
    if (!subName.trim()) {
      toast.error('Subcategory name is required')
      return
    }
    try {
      await categoryApi.createSubcategory(subCategoryId, { name: subName, description: subDesc })
      queryClient.invalidateQueries('categories')
      toast.success('Subcategory created')
      setSubOpen(false)
    } catch {
      toast.error('Failed to create subcategory')
    }
  }

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Delete this subcategory?')) return
    try {
      await categoryApi.deleteSubcategory(id)
      queryClient.invalidateQueries('categories')
      toast.success('Subcategory deleted')
    } catch {
      toast.error('Failed to delete subcategory')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Category</Button>
      </Box>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Subcategories</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.map(cat => {
              const isOpen = expanded.includes(cat.id)
              const subs = cat.subcategories || []
              return (
                <Fragment key={cat.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleExpanded(cat.id)}
                        aria-label={isOpen ? 'Collapse subcategories' : 'Expand subcategories'}>
                        {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{cat.description || '-'}</TableCell>
                    <TableCell>
                      <Chip label={`${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'}`}
                        size="small" onClick={() => toggleExpanded(cat.id)} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ my: 2, ml: 6 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Subcategories of {cat.name}
                            </Typography>
                            <Button size="small" startIcon={<AddIcon />} onClick={() => openSubDialog(cat.id)}>
                              Add Subcategory
                            </Button>
                          </Stack>
                          {subs.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No subcategories yet
                            </Typography>
                          ) : (
                            <Table size="small">
                              <TableBody>
                                {subs.map(sub => (
                                  <TableRow key={sub.id}>
                                    <TableCell>{sub.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{sub.description || '-'}</TableCell>
                                    <TableCell align="right" sx={{ width: 60 }}>
                                      <IconButton size="small" color="error"
                                        onClick={() => handleDeleteSubcategory(sub.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subOpen} onClose={() => setSubOpen(false)}>
        <DialogTitle>Add Subcategory</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={subName} onChange={(e) => setSubName(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description (optional)" value={subDesc} onChange={(e) => setSubDesc(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubcategory}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
