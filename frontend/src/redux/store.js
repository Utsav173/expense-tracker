import { configureStore } from '@reduxjs/toolkit'
import darkModeReducer from './slice/darkModeSlice'
import homeSliceReducer from './slice/homeSlice'
import accountSliceReducer from './slice/accountSlice'
import dashboardSliceReducer from './slice/dashboardSlice'
import profileSliceReducer from './slice/profileSlice'
import debtSliceReducer from './slice/debtSlice'

export const store = configureStore({
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: true,
  reducer: {
    darkMode: darkModeReducer,
    homePage: homeSliceReducer,
    accountPage: accountSliceReducer,
    dashboardPage: dashboardSliceReducer,
    profilePage: profileSliceReducer,
    debtPage: debtSliceReducer
  }
})
