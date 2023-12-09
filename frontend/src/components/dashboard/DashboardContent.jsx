import { Suspense, lazy } from "react";
import { Box, styled } from "@mui/material";
import { useSelector } from "react-redux";
import {
  selectByCategoryData,
  selectByFieldData,
  selectByIEChartData,
  selectByIEData,
} from "../../redux/slice/dashboardSlice";

import Loader from "../common/Loader";

const IEBCharts = lazy(() => import("./IEBCharts"));
const CategoryChart = lazy(() => import("./charts/CategoryChart"));
const IVEChart = lazy(() => import("./charts/IVEChart"));
const FieldChart = lazy(() => import("./charts/FieldChart"));
const BalanceChart = lazy(() => import("./charts/BalanceChart"));
const IEChart = lazy(() => import("./charts/IEChart"));

export const ChartBox = styled(Box)(({ theme }) => ({
  flex: 1,
  borderRadius: "8px",
  paddingLeft: "6px",
  paddingTop: "10px",
  paddingRight: "6px",
  paddingBottom: "0px",
}));

const DashboardContent = () => {
  const categoryChartData = useSelector(selectByCategoryData);
  const fieldChartData = useSelector(selectByFieldData);
  const ieChartData = useSelector(selectByIEData);
  const ieChartTwoData = useSelector(selectByIEChartData);

  return (
    <Suspense fallback={<Loader diff />}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <IEBCharts />
        <Box
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            gap: 2,
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          {categoryChartData.length > 0 && (
            <ChartBox
              sx={{
                flex: 1,
                flexFlow: "column",
                flexGrow: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#16222e" : "#fff0db",
                height: "full"
              }}
            >
              <CategoryChart
                categoryChartData={categoryChartData}
                key={"cat-chart-1"}
              />
            </ChartBox>
          )}
          {ieChartTwoData.length > 0 && (
            <ChartBox
              sx={{
                flex: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#14172e" : "#dee3ff",
              }}
            >
              <IVEChart ieChartTwoData={ieChartTwoData} key={"ive-chart-1"} />
            </ChartBox>
          )}
        </Box>
        {fieldChartData.length > 0 && (
          <ChartBox
            sx={{
              width: "100%",
              flex: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "#151d24" : "#EBF3F9ff",
            }}
          >
            <FieldChart fieldChartData={fieldChartData} key={"field-chart-1"} />
          </ChartBox>
        )}
        <Box
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            gap: 2,
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <ChartBox
            sx={{
              flex: 1,
              width: {
                xs: "100%",
                md: "auto",
              },
              backgroundColor: (theme) =>
                theme.palette.mode === "light" ? "#baeaffD6" : "#1a1915",
            }}
          >
            <BalanceChart />
          </ChartBox>
          {Object.keys(ieChartData).length > 0 && (
            <ChartBox
              sx={{
                flex: 1,
                width: {
                  xs: "100%",
                  md: "auto",
                },
                backgroundColor: (theme) =>
                  theme.palette.mode === "light" ? "#f0e6ff" : "#1c1429",
              }}
            >
              <IEChart data={ieChartData} key={"ie-chart-1"} />
            </ChartBox>
          )}
        </Box>
      </Box>
    </Suspense>
  );
};

export default DashboardContent;
