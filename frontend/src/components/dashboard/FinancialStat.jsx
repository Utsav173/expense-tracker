import React from "react";
import { currencyFormat } from "../../utils";
import {
  styled,
  Card,
  CardContent,
  Grid,
  Typography,
  Tooltip,
  Zoom,
  Box,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
  transition: "box-shadow 0.2s ease-in-out",
  border: "none",
  "&:hover": {
    boxShadow:
      theme.palette.mode === "light" &&
      "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;",
  },
  marginInline: "auto",
}));

const FinancialStat = ({ dashboardData }) => {
  return (
    <Grid container spacing={2} height={"100%"}>
      <Grid item xs={6} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#f0f0f0" : "#2E2E2E",
          }}
        >
          <CardContent
            sx={{
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              component="h6"
              textTransform={"capitalize"}
              gutterBottom
              sx={{
                fontSize: {
                  xs: "14px",
                  md: "18px",
                  lg: "20px",
                },
              }}
            >
              Total Accounts
            </Typography>

            <Typography
              variant="h4"
              component="h4"
              sx={{
                color: (theme) =>
                  theme.palette.mode === "light" ? "#2E2E2E" : "#f0f0f0",
                fontWeight: "bold",
                fontSize: {
                  xs: "26px",
                  md: "29px",
                  lg: "35px",
                },
              }}
            >
              {dashboardData.accountsInfo.length}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={6} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#2E2E2E" : "#f0f0f0",
          }}
        >
          <CardContent sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              component="h6"
              textTransform={"capitalize"}
              gutterBottom
              sx={{
                fontSize: {
                  xs: "16px",
                  md: "18px",
                  lg: "20px",
                },
              }}
            >
              Total Transactions
            </Typography>
            <Typography
              variant="h4"
              component="h4"
              sx={{
                fontWeight: "bold",
                fontSize: {
                  xs: "23px",
                  md: "28px",
                  lg: "35px",
                },
              }}
            >
              {dashboardData.totalTransaction}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={4} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#f0f8ff" : "#666ec9",
            color: (theme) =>
              theme.palette.mode === "light" ? "#0c2233" : "#00086b",
          }}
        >
          <CardContent
            sx={{
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              component="h6"
              textTransform={"capitalize"}
              sx={{
                fontSize: {
                  xs: "16px",
                  md: "18px",
                  lg: "20px",
                },
              }}
            >
              Balance
            </Typography>
            <Tooltip
              title={dashboardData.overallBalance}
              TransitionComponent={Zoom}
            >
              <Typography
                variant="h4"
                component="h4"
                sx={{
                  fontWeight: "bold",
                  fontSize: {
                    xs: "23px",
                    md: "28px",
                    lg: "35px",
                  },
                }}
              >
                {currencyFormat(dashboardData.overallBalance, "compact")}
              </Typography>
            </Tooltip>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={6} md={4} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#f0fff5" : "#3fdb69",
            color: (theme) =>
              theme.palette.mode === "light" ? "#0d3900" : "#004c00",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              "&.MuiCardContent-root": {
                paddingBlock: 2,
              },
            }}
          >
            <Typography
              variant="h6"
              component="h6"
              textTransform={"capitalize"}
              sx={{
                fontSize: {
                  xs: "18px",
                  md: "20px",
                  lg: "22px",
                },
              }}
            >
              Income
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "center",
                flexDirection: "column",
              }}
            >
              <Tooltip
                title={dashboardData.overallIncome}
                TransitionComponent={Zoom}
              >
                <Typography
                  variant="h4"
                  component="h4"
                  sx={{
                    fontWeight: "bold",
                    fontSize: {
                      xs: "23px",
                      md: "28px",
                      lg: "35px",
                    },
                  }}
                >
                  {currencyFormat(dashboardData.overallIncome, "compact")}
                </Typography>
              </Tooltip>
              <Box
                display={"inline-flex"}
                sx={{
                  color:
                    dashboardData.overallIncomePercentageChange < 0
                      ? "red"
                      : "green",
                }}
              >
                {dashboardData.overallIncomePercentageChange < 0 ? (
                  <TrendingDownIcon sx={{ color: "red", fontSize: 17 }} />
                ) : (
                  <TrendingUpIcon sx={{ color: "green", fontSize: 17 }} />
                )}
                <Typography fontStyle={"italic"} fontSize={"smaller"}>
                  {dashboardData.overallIncomePercentageChange}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={6} md={4} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#fff0f0" : "#db3f3f",
            color: (theme) =>
              theme.palette.mode === "light" ? "#330000" : "#4c0000",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              "&.MuiCardContent-root": {
                paddingBlock: 2,
              },
            }}
          >
            <Typography
              variant="h6"
              component="h6"
              textTransform={"capitalize"}
              sx={{
                fontSize: {
                  xs: "18px",
                  md: "20px",
                  lg: "22px",
                },
              }}
            >
              Expense
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "center",
                flexDirection: "column",
              }}
            >
              <Tooltip
                title={dashboardData.overallExpense}
                TransitionComponent={Zoom}
              >
                <Typography
                  variant="h4"
                  component="h4"
                  sx={{
                    fontWeight: "bold",
                    fontSize: {
                      xs: "23px",
                      md: "28px",
                      lg: "35px",
                    },
                  }}
                >
                  {currencyFormat(dashboardData.overallExpense, "compact")}
                </Typography>
              </Tooltip>
              <Box
                display={"inline-flex"}
                sx={{
                  color:
                    dashboardData.overallExpensePercentageChange < 0
                      ? "green"
                      : "#4c0000",
                }}
              >
                {dashboardData.overallExpensePercentageChange < 0 ? (
                  <TrendingDownIcon sx={{ color: "green", fontSize: 17 }} />
                ) : (
                  <TrendingUpIcon sx={{ color: "#4c0000", fontSize: 17 }} />
                )}
                <Typography fontStyle={"italic"} fontSize={"smaller"}>
                  {dashboardData.overallExpensePercentageChange}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
};

export default FinancialStat;
