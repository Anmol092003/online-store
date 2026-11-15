import { Outlet, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge,
  Box, Container, InputBase, Menu, MenuItem, Avatar, Drawer,
  List, ListItem, ListItemText, useMediaQuery, useTheme
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import SearchIcon from '@mui/icons-material/Search'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import MenuIcon from '@mui/icons-material/Menu'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CategorySidebar from './CategorySidebar'

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { cart } = useSelector((state) => state.cart)
  const [anchorEl, setAnchorEl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const cartCount = cart?.totalItems || 0

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setAnchorEl(null)
    navigate('/')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ bgcolor: '#464feb' }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component={Link} to="/"
            sx={{ color: '#fff', textDecoration: 'none', fontWeight: 700, mr: 3 }}>
            🛒 ShopEase
          </Typography>

          {!isMobile && (
            <Box component="form" onSubmit={handleSearch}
              sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 2, px: 2, mr: 3, flex: 1, maxWidth: 400 }}>
              <InputBase
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ color: '#fff', flex: 1 }}
                inputProps={{ 'aria-label': 'search' }}
              />
              <IconButton type="submit" sx={{ color: '#fff' }}>
                <SearchIcon />
              </IconButton>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && (
            <>
              <Button color="inherit" component={Link} to="/products">Products</Button>
              <Button color="inherit" onClick={() => setCategorySidebarOpen(true)}>Categories</Button>
            </>
          )}

          <IconButton color="inherit" component={Link} to="/cart">
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {user ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b35', fontSize: 14 }}>
                  {user.firstName?.[0]}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem component={Link} to="/profile">My Profile</MenuItem>
                <MenuItem component={Link} to="/orders">My Orders</MenuItem>
                <MenuItem component={Link} to="/addresses">Addresses</MenuItem>
                {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_SUB_ADMIN') && (
                  <MenuItem component={Link} to="/admin">Admin Panel</MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="outlined" color="inherit" component={Link} to="/login"
              sx={{ ml: 1, borderColor: 'rgba(255,255,255,0.5)' }}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <List sx={{ width: 250 }}>
          {[['Home', '/'], ['Products', '/products'], ['Cart', '/cart'], ['Profile', '/profile']].map(([text, path]) => (
            <ListItem key={text} component={Link} to={path} onClick={() => setMobileOpen(false)}>
              <ListItemText primary={text} />
            </ListItem>
          ))}
          <ListItem onClick={() => { setMobileOpen(false); setCategorySidebarOpen(true) }}>
            <ListItemText primary="Categories" />
          </ListItem>
        </List>
      </Drawer>

      <CategorySidebar open={categorySidebarOpen} onClose={() => setCategorySidebarOpen(false)} />

      <Container component="main" maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ bgcolor: '#1a1a2e', color: '#aaa', py: 4, mt: 'auto' }}>
        <Container maxWidth="xl">
          <Typography variant="body2" align="center">
            © 2024 ShopEase. Built with React + Spring Boot.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
