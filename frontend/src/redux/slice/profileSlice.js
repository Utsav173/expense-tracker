import { createSlice } from '@reduxjs/toolkit'
import { fetchProfile } from '../asyncThunk/profile'

const initialState = {
  profileData: null,
  status: 'idle',
  error: null,
  profileLoading: true
}

export const profileSlice = createSlice({
  name: 'profilePage',
  initialState,
  reducers: {
    setProfileLoading: (state, action) => {
      state.profileLoading = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.profileData = action.payload
        state.profileLoading = false
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        state.profileLoading = false
      })
  }
})

export default profileSlice.reducer

export const { setProfileLoading } = profileSlice.actions
