import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Loader from "../components/common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccounts } from "../redux/asyncThunk/home";
import { URL } from "../API/constant";
import toast from "react-hot-toast";
import axios from "axios";

const DateField = lazy(() => import("../components/statement/DateField"));
const Sidebar = lazy(() => import("../components/common/Sidebar"));

const Statement = () => {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.homePage);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numTransactions, setNumTransactions] = useState("");

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleGenerateStatement = async () => {
    let url = "";

    if (!selectedAccount || (!startDate && !endDate)) {
      return toast.error("Please fill all the required fields");
    }

    try {
      if (startDate && endDate) {
        url = `${URL.EXPORT_STATEMENT(selectedAccount)}?startDate=${new Date(
          startDate
        ).toISOString()}&endDate=${new Date(endDate).toISOString()}`;
      } else {
        url = `${URL.EXPORT_STATEMENT(
          selectedAccount
        )}?numTransactions=${numTransactions}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${
            JSON.parse(localStorage.getItem("user"))?.token
          }`,
        },
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", "statement.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSelectedAccount("");
      setStartDate("");
      setEndDate("");
      setNumTransactions("");
    } catch (error) {
      toast.error(error);
      // toast.error("Failed to generate statement. Please try again.");
    }
  };

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Box
          mt={7}
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <Typography component="h1" variant="h5">
            Generate Statements
          </Typography>
          <Box
            component={"form"}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateStatement();
            }}
            mt={3}
            sx={{
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={12} mb={2}>
                <FormControl margin="dense" fullWidth>
                  <InputLabel id="account-select-label">Account</InputLabel>
                  <Select
                    labelId="account-select-label"
                    id="account-select"
                    value={selectedAccount}
                    label="Account"
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select an account to generate statements
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <DateField
                    setEndDate={setEndDate}
                    setStartDate={setStartDate}
                    startDate={startDate}
                  />
                  <Divider>OR</Divider>
                  <Box>
                    <TextField
                      variant="outlined"
                      type="number"
                      name="numTransactions"
                      fullWidth
                      value={numTransactions}
                      onChange={(e) => setNumTransactions(e.target.value)}
                      label="Number of transactions"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Button
              variant="contained"
              type="submit"
              mt={2}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#ffe878" : "#242d38",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#241e00" : "#a8caf7",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#ffe04a" : "#24384f",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#292305" : "#ffffff",
                },
              }}
            >
              Generate
            </Button>
          </Box>
        </Box>
      </Suspense>
    </Sidebar>
  );
};

export default Statement;
