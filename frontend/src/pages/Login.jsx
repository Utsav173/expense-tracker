import { Link, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Avatar,
  TextField,
  Link as MULink,
  Grid,
  Box,
  Typography,
  Container,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import toast from "react-hot-toast";

// Other imports
import { APIs } from "../API";
import { URL } from "../API/constant";
import CustomBtn from "../components/Buttons/CustomBtn";
import { useState } from "react";
import { validateForm } from "../utils";

const CustomTextField = styled(TextField)(({ theme }) => ({
  "& input:-webkit-autofill": {
    WebkitBoxShadow:
      theme.palette.mode === "dark"
        ? "0 0 0 100px #111111 inset"
        : "0 0 0 100px #fafafa inset",
    WebkitTextFillColor: theme.palette.text.primary,
    caretColor: theme.palette.primary.main,
    borderRadius: "inherit",
    "&:focus": {
      borderColor: theme.palette.text.primary,
    },
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.mode === "dark" ? "#90f9b9" : "#0089fa",
  },
  "& input::selection": {
    backgroundColor: theme.palette.mode === "dark" ? "#292929" : "#abd9ff",
  },
}));

const LoginLink = styled(MULink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "none",
  transition: "color 0.3s",
  "&:hover": {
    color: theme.palette.mode === "dark" ? "#90f9b9" : "#0089fa",
  },
}));

const CustomContainer = styled(Box)(({ theme }) => ({
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.mode === "dark" ? "#202127" : "white",
  padding: "20px",
  borderRadius: "6px",
  boxShadow:
    theme.palette.mode === "dark"
      ? "rgba(50, 50, 50, 0.3) 0px 13px 27px -5px, rgba(105, 188, 255, 0.25) 0px 8px 16px -8px"
      : "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.1) 0px 8px 16px -8px",
  transition: "box-shadow 0.3s",
  "&:hover": {
    boxShadow:
      theme.palette.mode === "dark"
        ? "rgba(32, 33, 39, 0.25) 0px 50px 100px -20px, rgba(144, 202, 249, 0.2) 0px 30px 60px -30px"
        : "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px",
  },
}));

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!validateForm(email, password)) {
      setLoading(false);
      return;
    }

    try {
      const response = await APIs("POST", URL.LOGIN, { email, password });
      if (response?.data?.token) {
        toast.success("Login Success");
        setLoading(false);
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CustomContainer>
        <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
          Sign in
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ mt: 3, width: "100%" }}
        >
          <CustomTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            variant="outlined"
          />
          <CustomTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            variant="outlined"
          />
          <CustomBtn
            type="submit"
            fullWidth
            size="medium"
            disabled={loading}
            variant="contained"
          >
            Sign In
          </CustomBtn>

          <Grid container justifyContent="flex-end">
            <Grid item>
              <LoginLink component={Link} to="/signup" variant="body1">
                {"Don't have an account? Sign Up"}
              </LoginLink>
            </Grid>
          </Grid>
        </Box>
      </CustomContainer>
    </Container>
  );
}
