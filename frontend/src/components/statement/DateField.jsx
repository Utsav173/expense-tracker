import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers"; // Update import path
import { Box } from "@mui/material";

const DateField = ({ setStartDate, setEndDate, startDate }) => {
  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };
  const currentDate = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          justifyContent: "space-between",
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          width: "100%",
          gap: 2,
        }}
      >
        <Box flex={1}>
          <DatePicker
            label="Start Date"
            sx={{
              width: {
                xs: "100%",
                md: startDate ? "auto" : "100%",
              },
            }}
            maxDate={currentDate}
            value={null}
            onChange={handleStartDateChange}
          />
        </Box>
        {startDate && (
          <Box flex={1}>
            <DatePicker
              label="End Date"
              value={null}
              sx={{ width: "100%" }}
              maxDate={currentDate}
              minDate={startDate}
              onChange={handleEndDateChange}
            />
          </Box>
        )}{" "}
      </Box>
    </LocalizationProvider>
  );
};

export default DateField;
