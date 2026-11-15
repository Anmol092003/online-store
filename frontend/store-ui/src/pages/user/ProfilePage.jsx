import { useSelector } from 'react-redux'
import { Box, Typography, Paper, Avatar, Grid, Chip } from '@mui/material'

export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth)
  if (!user) return null

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>My Profile</Typography>
      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#464feb', fontSize: 32 }}>
            {user.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Chip label={user.role === 'ROLE_ADMIN' ? 'Admin' : 'Customer'}
              color={user.role === 'ROLE_ADMIN' ? 'error' : 'primary'} size="small" sx={{ mt: 1 }} />
          </Box>
        </Box>
        <Grid container spacing={2}>
          {[
            ['First Name', user.firstName],
            ['Last Name', user.lastName || '-'],
            ['Email', user.email || '-'],
            ['Phone', user.phone || '-'],
          ].map(([label, value]) => (
            <Grid item xs={6} key={label}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography fontWeight={500}>{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}
