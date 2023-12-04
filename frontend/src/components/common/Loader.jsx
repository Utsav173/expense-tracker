import Box from "@mui/material/Box";
import useTheme from "@mui/material/styles/useTheme";
import React from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

const Loader = () => {
  const theme = useTheme();
  return (
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
      <ScaleLoader
        color={theme.palette.mode === "light" ? "#000000" : "#ffffff"}
      />
    </Box>
  );
};

export default Loader;
