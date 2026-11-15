import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import cartApi from '../../api/cartApi'

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.getCart()
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error)
  }
})

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.addItem(productId, quantity)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to add item')
  }
})

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.removeItem(itemId)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error)
  }
})

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await cartApi.clearCart()
    return { items: [], totalAmount: 0, totalItems: 0 }
  } catch (err) {
    return rejectWithValue(err.response?.data?.error)
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => { state.cart = action.payload })
      .addCase(addToCart.fulfilled, (state, action) => { state.cart = action.payload })
      .addCase(removeFromCart.fulfilled, (state, action) => { state.cart = action.payload })
      .addCase(clearCart.fulfilled, (state) => { state.cart = null })
  },
})

export default cartSlice.reducer
