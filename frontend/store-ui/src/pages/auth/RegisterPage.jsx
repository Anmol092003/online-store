import { useDispatch } from 'react-redux'
import { initiateRegister, verifyRegisterOtp } from '../../store/slices/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import toast from 'react-hot-toast'
import { useState } from 'react'

const detailsSchema = Yup.object({
  firstName: Yup.string().required('First name required').max(50),
  lastName: Yup.string().max(50),
  emailOrPhone: Yup.string()
    .trim()
    .required('Email or phone number is required')
    .test('email-or-phone', 'Enter a valid email or 10-digit phone number', (value) =>
      Yup.string().email().isValidSync(value) || /^[6-9]\d{9}$/.test(value || '')
    ),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Password required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [step, setStep] = useState('details') // 'details' | 'otp'
  const [contact, setContact] = useState({ email: '', phone: '' })
  const [otp, setOtp] = useState('')

  const formik = useFormik({
    initialValues: { firstName: '', lastName: '', emailOrPhone: '', password: '', confirmPassword: '' },
    validationSchema: detailsSchema,
    onSubmit: async (values) => {
      setError(null)
      try {
        const { confirmPassword, emailOrPhone, ...userDetails } = values
        const contactValue = emailOrPhone.trim()
        const contactDetails = /^[6-9]\d{9}$/.test(contactValue)
          ? { phone: contactValue }
          : { email: contactValue }
        const payload = { ...userDetails, ...contactDetails }
        await dispatch(initiateRegister(payload)).unwrap()
        setContact({ email: contactDetails.email || '', phone: contactDetails.phone || '' })
        setStep('otp')
        toast.success('OTP sent successfully')
      } catch (err) {
        setError(err)
      }
    },
  })

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await dispatch(verifyRegisterOtp({ email: contact.email, phone: contact.phone, otp })).unwrap()
      toast.success('Registration successful! Welcome!')
      navigate('/')
    } catch (err) {
      setError(err)
    }
  }

  const field = (name, label, type = 'text', placeholder) => (
    <TextField fullWidth label={label} name={name} type={type}
      placeholder={placeholder}
      value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={{ mb: 2 }} />
  )

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 480, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>Create Account</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 'details' && (
          <form onSubmit={formik.handleSubmit}>
            {field('firstName', 'First Name')}
            {field('lastName', 'Last Name (optional)')}
            {field('emailOrPhone', 'Email or Phone number', 'text', 'Email or Phone number')}
            {field('password', 'Password', 'password')}
            {field('confirmPassword', 'Confirm Password', 'password')}
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={formik.isSubmitting}>
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <Typography sx={{ mb: 2 }}>
              We sent a verification code to{' '}
              {contact.email && contact.phone
                ? `${contact.email} and ${contact.phone}`
                : contact.email || contact.phone}
            </Typography>
            <TextField fullWidth label="Enter OTP" value={otp}
              onChange={(e) => setOtp(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth size="large">
              Verify & Create Account
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={() => setStep('details')}>
              Back
            </Button>
          </form>
        )}

        <Typography textAlign="center" mt={2}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#464feb', fontWeight: 600 }}>Login</Link>
        </Typography>
      </Paper>
    </Box>
  )
}
