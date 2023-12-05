import { lazy } from "react";
import { useTheme } from "@mui/material";
const Chart = lazy(() => import("react-apexcharts"));

const SmallChart = ({ data }) => {
  const {
    palette: { mode: themeMode },
  } = useTheme();
  const totalIncome = data.income;
  const totalExpense = data.expense;

  const series = [totalIncome, totalExpense];
  const labels = ["income", "expense"];

  const options = {
    chart: {
      type: "donut",
      background: "transparent",
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false, // Hide all labels
          },
        },
      },
    },
    stroke: {
      show: false, // Hide stroke
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: "gradient",
    },
    labels: labels,
    tooltip: {
      enabled: true, // Disable tooltip
    },
    legend: {
      show: false, // Disable legend
    },
    theme: {
      mode: themeMode,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="donut"
      height={90}
      width={90}
    />
  );
};

export default SmallChart;
