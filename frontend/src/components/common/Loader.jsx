import Box from "@mui/material/Box";
import useTheme from "@mui/material/styles/useTheme";
import React from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

const Loader = ({ diff = false }) => {
  const {
    palette: { mode },
  } = useTheme();

  return diff === true ? (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        flexFlow: "column",
      }}
    >
      <ScaleLoader color={mode === "light" ? "#000000" : "#ffffff"} />
    </Box>
  ) : (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        flexFlow: "column",
        backgroundColor: (theme) =>
          theme.palette.mode === "light" ? "#ffffff" : "#111111",
      }}
    >
      <ScaleLoader color={mode === "light" ? "#000000" : "#ffffff"} />
    </Box>
  );
};

export default Loader;
