import { useDispatch, useSelector } from 'react-redux'
import { login, clearError } from '../../store/slices/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Box, Paper, Typography, TextField, Button,
  Divider, Alert, CircularProgress
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import PhoneIcon from '@mui/icons-material/Phone'
import toast from 'react-hot-toast'

const validationSchema = Yup.object({
  emailOrPhone: Yup.string().required('Email or phone number required'),
  password: Yup.string().required('Password required'),
})

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)

  const formik = useFormik({
    initialValues: { emailOrPhone: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(login(values)).unwrap()
        toast.success('Welcome back!')
        navigate('/')
      } catch {}
    },
  })

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
          Sign In
        </Typography>

        {error && <Alert severity="error" onClose={() => dispatch(clearError())} sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <TextField fullWidth placeholder="Email or Phone Number" name="emailOrPhone"
            value={formik.values.emailOrPhone} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.emailOrPhone && Boolean(formik.errors.emailOrPhone)}
            helperText={formik.touched.emailOrPhone && formik.errors.emailOrPhone}
            sx={{ mb: 2 }} />

          <TextField fullWidth label="Password" name="password" type="password"
            value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            sx={{ mb: 3 }} />

          <Button type="submit" variant="contained" fullWidth size="large"
            disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Button variant="outlined" fullWidth startIcon={<PhoneIcon />}
          component={Link} to="/login/otp" sx={{ mb: 2 }}>
          Sign in with Phone (OTP)
        </Button>

        <Button variant="outlined" fullWidth startIcon={<GoogleIcon />} sx={{ mb: 3 }}
          onClick={() => toast('Google OAuth2 – configure Google Client ID in backend')}>
          Sign in with Google
        </Button>

        <Typography textAlign="center">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#464feb', fontWeight: 600 }}>Register</Link>
        </Typography>
      </Paper>
    </Box>
  )
}
