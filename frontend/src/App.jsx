import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import "./App.css";
import { useSelector } from "react-redux";
import { selectDarkMode } from "./redux/slice/darkmodeSlice";
import { Suspense, lazy, useMemo } from "react";
import Loader from "./components/common/Loader.jsx";
import { THEME_ID as MATERIAL_THEME_ID } from "@mui/material/styles";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Lazy-loaded components
const SignUpPage = lazy(() => import("./pages/Signup.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const LoginPage = lazy(() => import("./pages/Login.jsx"));
const HomePage = lazy(() => import("./pages/Home.jsx"));
const ImportPage = lazy(() => import("./pages/ImportPage.jsx"));
const AccountPage = lazy(() => import("./pages/Account.jsx"));
const ShareAccPage = lazy(() => import("./pages/ShareAccPage.jsx"));
const Statement = lazy(() => import("./pages/Statement.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const PrivateRoute = lazy(() => import("./API/PrivateRoute.jsx"));

function App() {
  const darkMode = useSelector(selectDarkMode);
  const appliedTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
        },
      }),
    [darkMode]
  );

  return (
    <Suspense fallback={<Loader />}>
      <ThemeProvider theme={appliedTheme}>
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
            <Route path="/signup" element={<SignUpPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Suspense>
  );
}

export default App;
