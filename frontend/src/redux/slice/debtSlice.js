import { createSlice } from '@reduxjs/toolkit'
import { calculateInterest, fetchDebtsList } from '../asyncThunk/debt'

const initialState = {
  debtsList: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  interestResult: null
}

export const debtSlice = createSlice({
  name: 'debtPage',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload
    },
    setTotalCount(state, action) {
      state.totalCount = action.payload
    },
    setTotalPages(state, action) {
      state.totalPages = action.payload
    },
    setIneresetResult(state, action) {
      state.interestResult = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDebtsList.fulfilled, (state, action) => {
        state.debtsList = action.payload.data
        state.isLoading = false
        state.error = null
        state.totalCount = action.payload.totalCount
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.currentPage
      })
      .addCase(fetchDebtsList.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(calculateInterest.fulfilled, (state, action) => {
        state.interestResult = action.payload
      })
      .addCase(calculateInterest.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { setLoading, setIneresetResult, setCurrentPage, setTotalCount, setTotalPages } =
  debtSlice.actions

export default debtSlice.reducer
