import * as React from "react";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import MULink from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { APIs } from "../API";
import { URL } from "../API/constant";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import CustomBtn from "../components/Buttons/CustomBtn";
import { FormHelperText, Input } from "@mui/material";
import { handleValidation } from "../utils";
import { Helmet } from "react-helmet";

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

const SignUpLink = styled(MULink)(({ theme }) => ({
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
  alignItems: "center",
  backgroundColor: theme.palette.mode === "dark" ? "#202127" : "white",
  padding: "20px",
  borderRadius: "6px",
  boxShadow:
    theme.palette.mode === "dark"
      ? "rgba(50, 50, 50, 0.3) 0px 13px 27px -5px, rgba(38, 40, 48, 0.25) 0px 8px 16px -8px"
      : "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.1) 0px 8px 16px -8px",
  transition: "box-shadow 0.3s",
  "&:hover": {
    boxShadow:
      theme.palette.mode === "dark"
        ? "rgba(32, 33, 39, 0.25) 0px 50px 100px -20px, #202127 0px 30px 60px -30px"
        : "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px",
  },
}));

export default function SignUpPage() {
  const navigate = useNavigate();
  const [importFile, setImportFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const isValid = handleValidation({ name, email, password });

    if (!isValid) {
      setLoading(false);
      return;
    }

    formData.append("profilePic", importFile);

    try {
      const response = await APIs("POST", URL.SIGNUP, formData);
      toast.success(response.message);
      setLoading(false);
      navigate("/login");
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
        <title>Signup | Expense Pro</title>
        <meta name="description" content="Sign up page of expense pro where you can signup with your email and password" />
        <link rel="canonical" href="https://track-expense-tan.vercel.app/signup" />
      </Helmet>
      <CustomContainer>
        <Avatar sx={{ m: 1, backgroundColor: "#ff499e" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <CustomTextField
                autoComplete="given-name"
                name="name"
                required
                fullWidth
                id="fullName"
                label="Full Name"
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
              />
            </Grid>
            <Grid item xs={12}>
              <label htmlFor="importfile">
                <Box
                  sx={{
                    cursor: "pointer",
                    borderRadius: "5px",
                    border: "1px solid",
                    display: "inline-flex",
                    width: "100%",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 1,
                    py: 1,
                    my: "auto",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark" ? "#5f5f5f" : "#0000003b",
                    color: (theme) => theme.palette.primary.main,
                    textDecoration: "none",
                    transition: "color 0.3s",
                    "&:hover": {
                      color: (theme) =>
                        theme.palette.mode === "dark" ? "#90f9b9" : "#0089fa",
                    },
                  }}
                >
                  <Typography variant="body1" component="div">
                    {importFile
                      ? `${importFile.name?.slice(0, 20)}...`
                      : "Profile Pic"}
                  </Typography>
                </Box>
                {importFile && (
                  <FormHelperText>
                    Size: {importFile.size} KB, lastModified:{" "}
                    {new Date(importFile.lastModified).toLocaleDateString(
                      "en-US",
                    )}
                  </FormHelperText>
                )}
                <Input
                  size="small"
                  type="file"
                  id="importfile"
                  inputProps={{
                    accept: "jpeg, png, jpg",
                  }}
                  onChange={(e) => setImportFile(e.target.files[0])}
                  sx={{
                    display: "none",
                  }}
                />
              </label>
            </Grid>
          </Grid>
          <CustomBtn
            type="submit"
            fullWidth
            size="medium"
            disabled={loading}
            variant="contained"
          >
            Sign Up
          </CustomBtn>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <SignUpLink component={Link} to="/login" variant="body1">
                {"Already have an account? Sign in"}
              </SignUpLink>
            </Grid>
          </Grid>
        </Box>
      </CustomContainer>
    </Container>
  );
}
