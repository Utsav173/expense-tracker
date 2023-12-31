import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import React, { Suspense, lazy, useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { setImportingLoading } from "../redux/slice/homeSlice";
import {
  fetchAccounts,
  handleConfirmImport,
  handleImportFile,
} from "../redux/asyncThunk/home";
import { Helmet } from "react-helmet";

const AddImportFile = lazy(() => import("../components/import/AddImportFile"));
const ConfirmImport = lazy(() => import("../components/import/ConfirmImport"));

const ImportPage = () => {
  const dispatch = useDispatch();
  const { importFile, importFileResult } = useSelector(
    (state) => state.homePage
  );
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);
  const handleSubmitFile = async (e) => {
    try {
      e.preventDefault();
      dispatch(setImportingLoading(true));
      const formData = new FormData(e.currentTarget);
      formData.append("document", importFile);
      await dispatch(handleImportFile(formData));
    } catch (error) {
      console.log(error);
    }
  };
  const handleConfirm = (id) => {
    try {
      dispatch(handleConfirmImport(id));
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Import Transaction | Expense Pro</title>
          <meta
            name="description"
            content="Welcome to import transaction page where you can import number of transactions in excel format to any of your accounts"
          />
          <link
            rel="canonical"
            href="https://track-expense-tan.vercel.app/import"
          />
        </Helmet>
        <Box
          my={7}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            flexFlow: "column",
          }}
        >
          <Typography component="h1" variant="h5">
            {importFileResult
              ? "Confirm Import"
              : "Import Transaction data from XLSX"}
          </Typography>
          {importFileResult ? (
            <ConfirmImport
              handleConfirm={handleConfirm}
              key={"confirm-file-comp"}
            />
          ) : (
            <AddImportFile
              handleSubmitFile={handleSubmitFile}
              key={"add-file-comp"}
            />
          )}
        </Box>
      </Suspense>
    </Sidebar>
  );
};

export default ImportPage;
