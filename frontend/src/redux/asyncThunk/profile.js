import { createAsyncThunk } from '@reduxjs/toolkit'
import { APIs } from '../../API'
import { URL } from '../../API/constant'
import toast from 'react-hot-toast'

export const fetchProfile = createAsyncThunk(
  'profilePage/fetchProfile',
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs('GET', URL.ME, {}, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)
