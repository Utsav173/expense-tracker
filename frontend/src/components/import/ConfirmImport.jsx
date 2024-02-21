import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
const ConfirmImport = ({ handleConfirm, loading }) => {
  const { importingLoading, importFileResult } = useSelector(
    (state) => state.homePage
  );
  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "green" }} />
        <Typography variant="h4" textAlign="center" sx={{ mt: 2 }}>
          {importFileResult.message}
        </Typography>
        <Typography variant="h5" textAlign="center" sx={{ mt: 1 }}>
          Total success rows: {importFileResult.totalRecords}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() => handleConfirm(importFileResult.successId)}
          startIcon={importingLoading ? <CircularProgress size={20} /> : null}
        >
          Confirm Import
        </Button>
      </Box>
    </Box>
  );
};

export default ConfirmImport;
