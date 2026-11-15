import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authApi from '../../api/authApi'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed')
  }
})

export const initiateRegister = createAsyncThunk('auth/initiateRegister', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authApi.initiateRegister(userData)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to send OTP')
  }
})

export const verifyRegisterOtp = createAsyncThunk('auth/verifyRegisterOtp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.verifyRegisterOtp(payload)
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'OTP verification failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) {
    try { await authApi.logout({ refreshToken }) } catch {}
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('accessToken'),
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null },
    setUser: (state, action) => { state.user = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(verifyRegisterOtp.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        localStorage.removeItem('user')
      })
  },
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
