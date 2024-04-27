import { createAsyncThunk } from '@reduxjs/toolkit'
import { APIs } from '../../API'
import { URL } from '../../API/constant'
import toast from 'react-hot-toast'
import { setLoading } from '../slice/debtSlice'

export const fetchDebtsList = createAsyncThunk(
  'debtPage/fetchDebtsList',
  async (_, { rejectWithValue, fulfillWithValue, dispatch, getState }) => {
    try {
      dispatch(setLoading(true))
      const response = await APIs('GET', URL.GET_DEBTS, {}, {}, true)
      dispatch(setLoading(false))
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const calculateInterest = createAsyncThunk(
  'debtPage/calculateInterest',
  async (data, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs('POST', URL.CALCULATE_INTEREST, data, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)
