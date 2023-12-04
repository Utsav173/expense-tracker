import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { selectDashboardData } from "../../redux/slice/dashboardSlice";
import { Box, Typography, Grid } from "@mui/material";
import Loader from "../common/Loader";
import { lazy } from "react";

const AccList = lazy(() => import("./AccList"));
const FinancialStat = lazy(() => import("./FinancialStat"));

const DashboardStat = () => {
  const dashboardData = useSelector(selectDashboardData);

  return !dashboardData ||
    !dashboardData.accountsInfo ||
    !Array.isArray(dashboardData.accountsInfo) ? (
    <Loader />
  ) : (
    <Suspense fallback={<Loader />}>
      <Box
        sx={{
          flexGrow: 1,
          height: {
            xs: "auto",
            sm: 420,
            md: 320,
          },
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Grid
          container
          spacing={2}
          height={{
            xs: "auto",
            sm: 400,
            md: 300,
          }}
        >
          <Grid item xs={12} sm={6} md={8} padding={0} height={"100%"}>
            <FinancialStat dashboardData={dashboardData} />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            height={{
              xs: "auto",
              sm: 400,
              md: 300,
            }}
          >
            <AccList dashboardData={dashboardData} />
          </Grid>
        </Grid>
      </Box>
    </Suspense>
  );
};

export default DashboardStat;
