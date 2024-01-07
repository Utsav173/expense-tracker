import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { selectDashboardData } from "../../redux/slice/dashboardSlice";
import { Box, Grid } from "@mui/material";
import Loader from "../common/Loader";
import { lazy } from "react";

const AccList = lazy(() => import("./AccList"));
const FinancialStat = lazy(() => import("./FinancialStat"));
const HighLowData = lazy(() => import("./HighLowData"));

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
        }}
      >
        <Grid item xs={12} sm={6} md={8} padding={0} marginBottom={2}>
          <HighLowData dashboardData={dashboardData} />
        </Grid>
        <Grid
          container
          spacing={2}
          sx={{
            height: {
              xs: "auto",
              sm: 420,
              md: 320,
            },
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
