import {
    Avatar,
    Box,
    Typography,
    Container,
  } from "@mui/material";
  import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
  import toast from "react-hot-toast";
  import { Helmet } from "react-helmet";
  
  // Other imports
  import { APIs } from "../API";
  import { URL } from "../API/constant";
  import CustomBtn from "../components/Buttons/CustomBtn";
  import { useState } from "react";
  import { CustomContainer, CustomTextField } from "./style";
  
  export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoading(true);
  
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
  
      if (!email || !email.trim()) {
        toast.error("Email is required");
        setLoading(false);
        return;
      }
  
      try {
        const response = await APIs("POST", URL.FORGOT_PASSWORD, { email });
        if (response?.message) {
          toast.success(response.message);
          setLoading(false);
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
        <Helmet>
          <title>Forgot Password | Expense Pro</title>
          <meta
            name="description"
            content="Welcome to Expense Pro forgot password page"
          />
          <link
            rel="canonical"
            href="https://track-expense-tan.vercel.app/forgot-password"
          />
        </Helmet>
        <CustomContainer>
          <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
            Enter Email to Reset Password
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
            <CustomBtn
              type="submit"
              fullWidth
              size="medium"
              disabled={loading}
              variant="contained"
            >
              Send Reset Link
            </CustomBtn>
          </Box>
        </CustomContainer>
      </Container>
    );
  }
  