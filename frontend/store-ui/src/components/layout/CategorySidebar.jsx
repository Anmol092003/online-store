import { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Drawer, Box, Typography, List, ListItemButton, ListItemText,
  Collapse, IconButton, Divider, CircularProgress
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import categoryApi from '../../api/categoryApi'

export default function CategorySidebar({ open, onClose }) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)

  const { data: categories, isLoading } = useQuery('categories', () =>
    categoryApi.getAll().then(r => r.data.data), { enabled: open }
  )

  const handleCategoryClick = (category) => {
    if (category.subcategories?.length > 0) {
      setExpandedId(expandedId === category.id ? null : category.id)
    } else {
      navigate(`/categories/${category.id}`)
      onClose()
    }
  }

  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    navigate(`/categories/${categoryId}?sub=${subcategoryId}`)
    onClose()
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" fontWeight={700}>Categories</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <List sx={{ overflowY: 'auto', flex: 1 }}>
            {categories?.map(category => (
              <Box key={category.id}>
                <ListItemButton onClick={() => handleCategoryClick(category)}>
                  <ListItemText primary={category.name} />
                  {category.subcategories?.length > 0 && (
                    expandedId === category.id ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  )}
                </ListItemButton>
                {category.subcategories?.length > 0 && (
                  <Collapse in={expandedId === category.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {category.subcategories.map(sub => (
                        <ListItemButton
                          key={sub.id}
                          sx={{ pl: 4 }}
                          onClick={() => handleSubcategoryClick(category.id, sub.id)}
                        >
                          <ChevronRightIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                          <ListItemText primary={sub.name} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  )
}
