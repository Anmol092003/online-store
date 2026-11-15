import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, Divider
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import InventoryIcon from '@mui/icons-material/Inventory'
import CategoryIcon from '@mui/icons-material/Category'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

const DRAWER_WIDTH = 240

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Products', icon: <InventoryIcon />, path: '/admin/products' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
  { text: 'Orders', icon: <ShoppingBagIcon />, path: '/admin/orders' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
]

const superAdminMenuItems = [
  { text: 'Sub Admins', icon: <AdminPanelSettingsIcon />, path: '/admin/sub-admins' },
]

export default function AdminLayout() {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const items = user?.role === 'ROLE_ADMIN' ? [...menuItems, ...superAdminMenuItems] : menuItems

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: '#464feb' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            🛒 ShopEase Admin
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>
            Back to Store
          </Link>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', mt: '64px' }
      }}>
        <List>
          {items.map((item) => (
            <ListItemButton key={item.text} component={Link} to={item.path}
              selected={location.pathname === item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
