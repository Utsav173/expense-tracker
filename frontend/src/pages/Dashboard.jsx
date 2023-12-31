import { Suspense, lazy, useEffect } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";

import Loader from "../components/common/Loader";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchByCategory,
  fetchByField,
  fetchDashboardData,
  fetchDashboardIEChart,
  fetchIEData,
} from "../redux/asyncThunk/dashboard";
import Lottie from "lottie-react";
import noDataLight from "../assets/noData-light.json";
import { Helmet } from "react-helmet";

const Sidebar = lazy(() => import("../components/common/Sidebar"));
const DashboardContent = lazy(() =>
  import("../components/dashboard/DashboardContent")
);
const DashBoradHeader = lazy(() =>
  import("../components/dashboard/DashBoradHeader")
);
const DashboardStat = lazy(() =>
  import("../components/dashboard/DashboardStat")
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { duration, field, dashboardData } = useSelector(
    (state) => state.dashboardPage
  );

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        dispatch(fetchDashboardData()),
        dispatch(fetchByCategory({ duration: duration })),
        dispatch(fetchByField({ duration: duration, field: field })),
        dispatch(fetchDashboardIEChart({ duration: duration })),
        dispatch(fetchIEData({ duration: duration })),
      ]);
    };

    fetchData();
  }, [dispatch, duration, field]);
  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Dashboard | Expense Pro</title>
          <meta
            name="description"
            content="Welcome to dashboard of expense pro, where you can find multiple analytics of your accounts with different chart and useful information"
          />
          <link
            rel="canonical"
            href="https://track-expense-tan.vercel.app/dashboard"
          />
        </Helmet>
        {dashboardData.totalTransaction < 4 ? (
          <Box
            my={7}
            sx={{
              width: "100%",
              display: "flex",
              minHeight: "80vh",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Lottie
              animationData={noDataLight}
              loop={true}
              style={{
                width: 300,
                height: 300,
              }}
            />
            <Typography variant="h5">No Enough Data</Typography>
          </Box>
        ) : (
          <Box
            my={7}
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <DashboardStat />
            <Stack width={"100%"} spacing={2} my={2}>
              <DashBoradHeader />
              <DashboardContent />
            </Stack>
          </Box>
        )}
      </Suspense>
    </Sidebar>
  );
};

export default Dashboard;
