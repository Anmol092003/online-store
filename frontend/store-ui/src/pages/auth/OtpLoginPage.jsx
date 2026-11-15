import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import authApi from '../../api/authApi'
import toast from 'react-hot-toast'

export default function OtpLoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendOtp = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authApi.sendOtp(phone)
      setStep(2)
      toast.success('OTP sent to ' + phone)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await authApi.verifyOtp(phone, otp)
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      dispatch(setUser(data.data.user))
      toast.success('Login successful!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
          Phone OTP Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 1 ? (
          <>
            <TextField fullWidth label="Phone Number" value={phone}
              onChange={(e) => setPhone(e.target.value)} sx={{ mb: 3 }}
              placeholder="10-digit mobile number" />
            <Button variant="contained" fullWidth size="large" onClick={sendOtp} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              OTP sent to {phone}
            </Typography>
            <TextField fullWidth label="Enter OTP" value={otp}
              onChange={(e) => setOtp(e.target.value)} sx={{ mb: 3 }}
              inputProps={{ maxLength: 6 }} />
            <Button variant="contained" fullWidth size="large" onClick={verifyOtp} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={() => setStep(1)}>Change Number</Button>
          </>
        )}
      </Paper>
    </Box>
  )
}
