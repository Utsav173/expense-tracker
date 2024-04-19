import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setImportFile } from "../../redux/slice/homeSlice";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoIcon from "@mui/icons-material/Info";
import { URL } from "../../API/constant";
import axios from "axios";
const AddImportFile = ({ handleSubmitFile, loading }) => {
  const dispatch = useDispatch();
  const { accounts, importFile } = useSelector((state) => state.homePage);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    dispatch(setImportFile(file));
  };

  const handleDownloadSampleFile = async () => {
    const userToken = JSON.parse(localStorage.getItem("user"))?.token;
    const response = await axios.get(URL.GET_SAMPLE_FILE, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    const href = window.URL.createObjectURL(response.data);

    const anchorElement = document.createElement("a");

    anchorElement.href = href;
    anchorElement.download = "sample.xlsx";

    document.body.appendChild(anchorElement);
    anchorElement.click();

    document.body.removeChild(anchorElement);
    window.URL.revokeObjectURL(href);
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => handleSubmitFile(e)}
      sx={{ mt: 3 }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="account-select-label" size="small">
              Account
            </InputLabel>
            <Select
              labelId="account-select-label"
              id="account-select"
              label="Account"
              name="accountId"
              size="small"
              disabled={loading}
            >
              {accounts.length > 0 &&
                accounts.map((v, i) => (
                  <MenuItem key={i} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText>
              Select an account to import transactions
            </FormHelperText>
          </FormControl>
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
                  theme.palette.mode === "dark" ? "#5f5f5f" : "#7e7e7e",
              }}
            >
              <AttachFileIcon />
              <Typography variant="body1" component="div">
                {importFile
                  ? `${importFile.name?.slice(0, 20)}...`
                  : "Select transactions file"}
              </Typography>
            </Box>
            {importFile && (
              <FormHelperText>
                Size: {importFile.size} KB, lastModified:{" "}
                {new Date(importFile.lastModified).toLocaleDateString("en-US")}
              </FormHelperText>
            )}
            <Input
              size="small"
              type="file"
              id="importfile"
              inputProps={{
                accept: ".xlsx",
              }}
              disabled={loading}
              onChange={(e) => handleFileChange(e)}
              sx={{
                display: "none",
              }}
            />
            <Button
              onClick={handleDownloadSampleFile}
              sx={{
                marginLeft: "auto",
                fontSize: "12px",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: (theme) =>
                    theme.palette.mode === "light" ? "black" : "white",
                },
              }}
              size="small"
              startIcon={<InfoIcon />}
            >
              Download sample file
            </Button>
          </label>
        </Grid>
      </Grid>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{
          mt: 3,
          mb: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === "light" ? "#001f37" : "#353f46",
          color: (theme) => (theme.palette.mode === "light" ? "#fff" : "#fff"),
        }}
        disabled={loading}
      >
        Confirm
      </Button>
    </Box>
  );
};

export default AddImportFile;
