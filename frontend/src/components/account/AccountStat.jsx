import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { currencyFormat } from "../../utils";
import Loader from "../common/Loader";

const AccStatChart = lazy(() => import("./chart/AccStatChart"));

const AccountStat = () => {
  const { accountStat, amountCharts } = useSelector(
    (state) => state.accountPage,
  );
  const theme = useTheme();

  return (
    <Suspense fallback={<Loader />}>
      {Object.keys(accountStat).length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            width: "100%",
            gap: {
              xs: 2,
              md: 3,
            },
            justifyContent: "space-between",
            alignItems: "stretch",
            marginBottom: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              position: "relative",
              backgroundColor:
                theme.palette.mode === "dark" ? "#161c16" : "#ebffebBF",
              borderRadius: "10px",
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.04) 0px 3px 5px;"
                  : "rgba(25, 41, 25, 0.9) 0px 0px 17px inset;",
              border: (theme) =>
                theme.palette.mode === "dark" && "0.15px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark" && "#0f170f",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px",
                background: "transparent",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "inherit", fontSize: "20px", zIndex: 100 }}
              >
                Income
              </Typography>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  zIndex: 100,
                  fontWeight: "bold",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#75c783" : "#1e2620",
                }}
              >
                {currencyFormat(accountStat.income)}
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                color={"green"}
                zIndex={100}
              >
                <Typography sx={{}}>
                  {accountStat.IncomePercentageChange}%
                </Typography>
                {accountStat.IncomePercentageChange > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 20, color: "green" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 20, color: "green" }} />
                )}
              </Box>
            </Box>
            <Box
              sx={{
                position: "absolute",
                zIndex: 0,
                bottom: (theme) => (theme.palette.mode === "light" ? 3 : 5),
                width: "100%",
                opacity: 0.8,
              }}
            >
              <AccStatChart icomeType={true} data={amountCharts.income} />
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "16px",
              backgroundColor:
                theme.palette.mode === "dark" ? "#1e2124" : "#ebf7ffBF",
              borderRadius: "10px",
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.04) 0px 3px 5px;"
                  : "rgba(0, 0, 0, 0.3) 0px 0px 17px inset;",
              border: (theme) =>
                theme.palette.mode === "dark" && "0.15px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark" && "#111417",
              "&:hover": {
                boxShadow: (theme) =>
                  theme.palette.mode === "light"
                    ? "rgba(0, 0, 0, 0.04) 0px 3px 5px;"
                    : "rgba(0, 99, 166, 0.2) 0px 0px 25px inset;",
              },
            }}
          >
            <Tooltip title="this balance is only related to the duration and it not sync with main balance">
              <Typography variant="h6" gutterBottom>
                Balance
              </Typography>
              <Typography
                variant="h5"
                gutterBottom
                fontWeight={"bold"}
                sx={{
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#759ec7" : "#161c21",
                }}
              >
                {currencyFormat(accountStat.balance)}
              </Typography>{" "}
            </Tooltip>
          </Box>
          <Box
            sx={{
              flex: 1,
              position: "relative",
              backgroundColor:
                theme.palette.mode === "dark" ? "#1a1414" : "#ffd9d9BF",
              borderRadius: "10px",
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.04) 0px 3px 5px;"
                  : "rgba(41, 25, 25, 0.9) 0px 0px 17px inset;",
              border: (theme) =>
                theme.palette.mode === "dark" && "0.15px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark" && "rgba(41, 25, 25, 0.8)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px",
                background: "transparent",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Expense
              </Typography>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  zIndex: 100,
                  fontWeight: "bold",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#db6e6e" : "#261e1e",
                }}
              >
                {currencyFormat(accountStat.expense)}
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                color={"red"}
                zIndex={100}
              >
                <Typography>{accountStat.ExpensePercentageChange}%</Typography>
                {accountStat.ExpensePercentageChange > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 20, color: "red" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 20, color: "red" }} />
                )}
              </Box>
            </Box>
            <Box
              sx={{
                position: "absolute",
                bottom: (theme) => (theme.palette.mode === "light" ? 3 : 5),
                zIndex: 0,
                width: "100%",
                opacity: 0.8,
              }}
            >
              <AccStatChart icomeType={false} data={amountCharts.expense} />
            </Box>
          </Box>
        </Box>
      )}
    </Suspense>
  );
};

export default AccountStat;
