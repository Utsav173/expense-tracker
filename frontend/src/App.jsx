import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Suspense, lazy } from 'react'
import Loader from './components/common/Loader.jsx'
import {
  experimental_extendTheme as materialExtendTheme,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  THEME_ID as MATERIAL_THEME_ID
} from '@mui/material/styles'
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles'
import { useSelector } from 'react-redux'
import { selectDarkMode } from './redux/slice/darkModeSlice.js'

// Lazy-loaded components
const SignUpPage = lazy(() =>
  import('./pages/SignUpPage.jsx').then(module => ({ default: module.SignUpPage }))
)
const Dashboard = lazy(() =>
  import('./pages/DashboardPage.jsx').then(module => ({ default: module.DashboardPage }))
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage.jsx').then(module => ({ default: module.LoginPage }))
)
const ForgotPassword = lazy(() =>
  import('./pages/ForgotPasswordPage.jsx').then(module => ({ default: module.ForgotPasswordPage }))
)
const ResetPassword = lazy(() =>
  import('./pages/ResetPasswordPage.jsx').then(module => ({ default: module.ResetPasswordPage }))
)
const HomePage = lazy(() =>
  import('./pages/HomePage.jsx').then(module => ({ default: module.HomePage }))
)
const ImportPage = lazy(() =>
  import('./pages/ImportPage.jsx').then(module => ({ default: module.ImportPage }))
)
const AccountPage = lazy(() =>
  import('./pages/AccountPage.jsx').then(module => ({ default: module.AccountPage }))
)
const ShareAccPage = lazy(() =>
  import('./pages/ShareAccPage.jsx').then(module => ({ default: module.ShareAccPage }))
)
const Statement = lazy(() =>
  import('./pages/StatementPage.jsx').then(module => ({ default: module.StatementPage }))
)
const Profile = lazy(() =>
  import('./pages/ProfilePage.jsx').then(module => ({ default: module.ProfilePage }))
)
const DebtPage = lazy(() =>
  import('./pages/DebtPage.jsx').then(module => ({ default: module.DebtPage }))
)
const PrivateRoute = lazy(() =>
  import('./API/PrivateRoute.jsx').then(module => ({ default: module.PrivateRoute }))
)

const materialTheme = materialExtendTheme()

function App() {
  const userMode = useSelector(selectDarkMode)
  return (
    <MaterialCssVarsProvider
      defaultMode={userMode ? 'dark' : 'light'}
      theme={{ [MATERIAL_THEME_ID]: materialTheme }}
    >
      <JoyCssVarsProvider defaultMode={userMode ? 'dark' : 'light'}>
        <CssBaseline enableColorScheme />
        <Suspense fallback={<Loader />}>
          <Toaster position='top-center' reverseOrder={false} />
          <BrowserRouter>
            <Routes>
              <Route element={<PrivateRoute />}>
                <Route path='/' element={<HomePage />} />
                <Route path='/account/:id' element={<AccountPage />} />
                <Route path='/share-accounts' element={<ShareAccPage />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/import' element={<ImportPage />} />
                <Route path='/statement' element={<Statement />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/debt' element={<DebtPage />} />
              </Route>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/reset-password' element={<ResetPassword />} />
              <Route path='/signup' element={<SignUpPage />} />
              <Route path='*' element={<Navigate to='/' />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </JoyCssVarsProvider>
    </MaterialCssVarsProvider>
  )
}

export default App
