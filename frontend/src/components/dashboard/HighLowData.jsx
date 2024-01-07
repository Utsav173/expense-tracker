import React from "react";
import { currencyFormat } from "../../utils";
import {
  styled,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

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

const HighLowData = ({ dashboardData }) => {
  return (
    <Grid container spacing={2} height={"100%"}>
      <Grid item xs={6} md={3} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#fff6f0" : "#141414",
            color: (theme) =>
              theme.palette.mode === "light" ? "#330000" : "#ffa6a6",
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
            <Typography textTransform={"capitalize"}>
              Expensive Expense:{" "}
              {dashboardData.mostExpensiveExpense
                ? currencyFormat(
                    dashboardData.mostExpensiveExpense.amount,
                    "compact"
                  )
                : "N/A"}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Cheapest Expense */}
      <Grid item xs={6} md={3} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#fff6f0" : "#141414",
            color: (theme) =>
              theme.palette.mode === "light" ? "#330000" : "#ffd9d9",
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
            <Typography textTransform={"capitalize"}>
              Cheapest Expense:{" "}
              {dashboardData.cheapestExpense
                ? currencyFormat(
                    dashboardData.cheapestExpense.amount,
                    "compact"
                  )
                : "N/A"}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Most Expensive Income */}
      <Grid item xs={6} md={3} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#f0fff3" : "#1c1c1c",
            color: (theme) =>
              theme.palette.mode === "light" ? "#0d3900" : "#b6ffa6",
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
            <Typography textTransform={"capitalize"}>
              Biggest Income:{" "}
              {dashboardData.mostExpensiveIncome
                ? currencyFormat(
                    dashboardData.mostExpensiveIncome.amount,
                    "compact"
                  )
                : "N/A"}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Cheapest Income */}
      <Grid item xs={6} md={3} height={"full"}>
        <StyledCard
          variant="elevation"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#f0fff3" : "#1c1c1c",
            color: (theme) =>
              theme.palette.mode === "light" ? "#0d3900" : "#e0ffd9",
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
            <Typography textTransform={"capitalize"}>
              Cheapest Income:{" "}
              {dashboardData.cheapestIncome
                ? currencyFormat(dashboardData.cheapestIncome.amount, "compact")
                : "N/A"}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
};

export default HighLowData;
