import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setDuration, setField } from "../../redux/slice/dashboardSlice";

const DashBoradHeader = () => {
  const dispatch = useDispatch();
  const { duration, field } = useSelector((state) => state.dashboardPage);

  return (
    <Box
      sx={{
        width: "100%",
        display: "inline-flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3,
      }}
    >
      <FormControl
        sx={{
          flex: 1,
        }}
      >
        <InputLabel id="duration-filter-label">Filter by Duration</InputLabel>
        <Select
          labelId="duration-filter-label"
          value={duration}
          onChange={(e) => dispatch(setDuration(e.target.value))}
          label="Filter by Duration"
          size="small"
          sx={{
            borderRadius: (theme) =>
              theme.palette.mode == "light" ? "20px" : "5px",
            paddingBlock: (theme) =>
              theme.palette.mode == "light" && theme.spacing(0.2),
          }}
        >
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="thisWeek">This Week</MenuItem>
          <MenuItem value="thisMonth">This Month</MenuItem>
          <MenuItem value="thisYear">This Year</MenuItem>
        </Select>
      </FormControl>
      <FormControl
        sx={{
          flex: 1,
        }}
      >
        <InputLabel id="field-filter-label">Filter by Field</InputLabel>
        <Select
          labelId="field-filter-label"
          value={field}
          onChange={(e) => dispatch(setField(e.target.value))}
          label="Filter by Field"
          size="small"
          sx={{
            borderRadius: (theme) =>
              theme.palette.mode == "light" ? "20px" : "5px",
            paddingBlock: (theme) =>
              theme.palette.mode == "light" && theme.spacing(0.2),
          }}
        >
          <MenuItem value="amount">Amount</MenuItem>
          <MenuItem value="transfer">Transfer</MenuItem>
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="isIncome">Type</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default DashBoradHeader;
