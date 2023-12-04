import { Button, styled } from "@mui/material";
import React from "react";
import PropTypes from "prop-types";

const CustomButton = styled(Button)(({ theme }) => ({
  borderRadius: "20px",
  backgroundColor: theme.palette.mode === "dark" ? "#47A846" : "#5CD65C", // Adjusted green color
  color: theme.palette.mode === "dark" ? "#1c2e5e" : "#005b85", // Retained text color for dark mode
  boxShadow:
    theme.palette.mode === "light" &&
    "rgba(40, 167, 69, 0.3) 0px 1px 2px 0px, rgba(40, 167, 69, 0.15) 0px 2px 6px 2px;", // Adjusted shadow for green color
  fontWeight: "bold",
  padding: "7px 16px",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "#5CD65C" : "#005b85", // Adjusted hover background color
    color: theme.palette.mode === "dark" ? "black" : "#5CD65C", // Adjusted hover text color
    boxShadow:
      theme.palette.mode === "light"
        ? "rgba(0, 91, 133, 0.1) 0px 4px 16px, rgba(0, 91, 133, 0.1) 0px 8px 24px, rgba(0, 91, 133, 0.1) 0px 16px 56px;"
        : "rgba(40, 167, 69, 0.3) 0px 18px 50px -10px;", // Adjusted hover shadow for green color
  },
}));

const CreateBtn = ({ children, ...props }) => {
  return (
    <CustomButton aria-label="create-form-btn" {...props}>
      {children}
    </CustomButton>
  );
};
CreateBtn.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CreateBtn;
