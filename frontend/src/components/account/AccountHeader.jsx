import React from "react";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import useMediaQuery from "@mui/material/useMediaQuery";
const AddTransaction = React.lazy(() => import("./AddTransactions"));
const ShareAccounts = React.lazy(() => import("./ShareAccounts"));
const SearchComponent = React.lazy(() => import("../common/SearchComponent"));

const AccountHeader = ({ id, durationFilter, handleApplyFilter, setQ }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  return (
    <Toolbar
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "rgb(174 173 173 / 25%) 0px 4px 9px -2px, rgb(39 45 49 / 50%) 0px 0px 0px 1px"
            : "rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px",
        borderRadius: "8px",
        py: 2,
        marginBottom: 4,
        gap: 3,
      }}
    >
      <Box sx={{ flex: 1, width: { xs: "100%", md: "auto" } }}>
        <AddTransaction accountId={id} />
      </Box>
      <Box sx={{ flex: 1, width: { xs: "100%", md: "auto" } }}>
        <ShareAccounts accountId={id} />
      </Box>
      {isMobile && (
        <Box sx={{ flex: 1, width: { xs: "100%", md: "auto" } }}>
          <SearchComponent isSpecial isHomepage={false} setQ={setQ} />
        </Box>
      )}
      <Box sx={{ flex: 1, width: { xs: "100%", md: "auto" } }}>
        <FormControl sx={{ minWidth: 150, width: "100%" }}>
          <InputLabel id="duration-filter-label">Filter by Duration</InputLabel>
          <Select
            labelId="duration-filter-label"
            value={durationFilter}
            onChange={handleApplyFilter}
            label="Filter by Duration"
            size="small"
            sx={{
              borderRadius: "20px",
              paddingBlock: (theme) => theme.spacing(0.2),
            }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="thisWeek">This Week</MenuItem>
            <MenuItem value="thisMonth">This Month</MenuItem>
            <MenuItem value="thisYear">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Toolbar>
  );
};

export default AccountHeader;
