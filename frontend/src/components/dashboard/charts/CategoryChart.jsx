import { useTheme } from "@mui/material";
import { Suspense, lazy } from "react";
import { currencyFormat } from "../../../utils";
import { ScaleLoader } from "react-spinners";
const Chart = lazy(() => import("react-apexcharts"));

const CategoryChart = ({ categoryChartData }) => {
  const {
    palette: { mode: colorMode },
  } = useTheme();

  const lightModeIncomeColor = "#fe8601";
  const darkModeIncomeColor = "#6eb3ff";
  const lightModeExpenseColor = "#e64719";
  const darkModeExpenseColor = "#8f73ff";

  const categories = categoryChartData.map((category) => category.name);
  const totalIncomes = categoryChartData.map(
    (category) => category.totalIncome,
  );
  const totalExpenses = categoryChartData.map(
    (category) => category.totalExpense,
  );

  const series = [
    {
      name: "Total Income",
      data: totalIncomes,
      color: colorMode === "light" ? lightModeIncomeColor : darkModeIncomeColor,
    },
    {
      name: "Total Expense",
      data: totalExpenses,
      color:
        colorMode === "light" ? lightModeExpenseColor : darkModeExpenseColor,
    },
  ];

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      background: "transparent",
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 3,
        opacity: 0.1,
      },
    },
    responsive: [
      {
        breakpoint: 870,
        options: {
          title: {
            style: {
              fontSize: "10px",
            },
          },
        },
      },
    ],
    grid: {
      show: false,
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: true,
        color: colorMode === "light" ? "#16202b" : "#6d89a8",
      },
      labels: {
        show: true,
        tooltip: {
          enabled: true,
        },
      },
      tooltip: {
        enabled: true, // Enable tooltip for x-axis
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => currencyFormat(val, "compact"),
      },
      title: {
        text: "Spent by Category",
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: colorMode === "light" ? "#16202b" : "#6d89a8", // X-axis border color
      },
      axisTicks: {
        show: true,
        color: colorMode === "light" ? "#16202b" : "#6d89a8", // X-axis border color
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (val) => currencyFormat(val, "compact"),
      },
    },
    theme: {
      mode: colorMode,
    },
  };

  return (
    <Suspense
      fallback={
        <ScaleLoader color={colorMode === "light" ? "#000000" : "#ffffff"} />
      }
    >
      <Chart
        options={options}
        series={series}
        type="bar"
        height={400}
        width={"100%"}
      />
    </Suspense>
  );
};

export default CategoryChart;
