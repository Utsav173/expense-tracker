import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Suspense, lazy } from "react";
import Loader from "./components/common/Loader.jsx";
import {
  experimental_extendTheme as materialExtendTheme,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from "@mui/material/styles";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy/styles";
import { useSelector } from "react-redux";
import { selectDarkMode } from "./redux/slice/darkModeSlice.js";

// Lazy-loaded components
const SignUpPage = lazy(() => import("./pages/Signup.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const LoginPage = lazy(() => import("./pages/Login.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const HomePage = lazy(() => import("./pages/Home.jsx"));
const ImportPage = lazy(() => import("./pages/ImportPage.jsx"));
const AccountPage = lazy(() => import("./pages/Account.jsx"));
const ShareAccPage = lazy(() => import("./pages/ShareAccPage.jsx"));
const Statement = lazy(() => import("./pages/Statement.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const PrivateRoute = lazy(() => import("./API/PrivateRoute.jsx"));
const materialTheme = materialExtendTheme();

function App() {
  const userMode = useSelector(selectDarkMode);
  return (
    <Suspense fallback={<Loader />}>
      <MaterialCssVarsProvider
        defaultMode={userMode ? "dark" : "light"}
        theme={{ [MATERIAL_THEME_ID]: materialTheme }}
      >
        <JoyCssVarsProvider defaultMode={userMode ? "dark" : "light"}>
          <CssBaseline enableColorScheme />
          <Toaster position="top-center" reverseOrder={false} />
          <BrowserRouter>
            <Routes>
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/account/:id" element={<AccountPage />} />
                <Route path="/share-accounts" element={<ShareAccPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/statement" element={<Statement />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </JoyCssVarsProvider>
      </MaterialCssVarsProvider>
    </Suspense>
  );
}

export default App;
