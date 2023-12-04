import { Button, styled } from "@mui/material";
import React from "react";
import PropTypes from "prop-types";

const CustomButton = styled(Button)(({ theme }) => ({
  borderRadius: "20px",
  backgroundColor: theme.palette.mode === "dark" ? "#FF6347" : "#FF7F7F", // Adjusted red color
  color: theme.palette.mode === "dark" ? "#1c2e5e" : "#005b85", // Retained text color for dark mode
  boxShadow:
    theme.palette.mode === "light" &&
    "rgba(255, 99, 71, 0.3) 0px 1px 2px 0px, rgba(255, 99, 71, 0.15) 0px 2px 6px 2px;", // Adjusted shadow for red color
  fontWeight: "bold",
  padding: "7px 16px",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "#FF7F7F" : "#005b85", // Adjusted hover background color
    color: theme.palette.mode === "dark" ? "black" : "#FF7F7F", // Adjusted hover text color
    boxShadow:
      theme.palette.mode === "light"
        ? "rgba(0, 91, 133, 0.1) 0px 4px 16px, rgba(0, 91, 133, 0.1) 0px 8px 24px, rgba(0, 91, 133, 0.1) 0px 16px 56px;"
        : "rgba(255, 99, 71, 0.3) 0px 18px 50px -10px;", // Adjusted hover shadow for red color
  },
}));

const CancelBtn = ({ children, ...props }) => {
  return (
    <CustomButton aria-label="cancel-form-btn" {...props}>
      {children}
    </CustomButton>
  );
};
CancelBtn.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CancelBtn;
