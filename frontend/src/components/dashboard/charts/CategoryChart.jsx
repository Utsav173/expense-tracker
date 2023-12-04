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

  const options = {
    chart: {
      background: "transparent",
      type: "bar",
      stacked: false,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          reset: true | '<img src="/static/icons/reset.png" width="20">',
        },
        export: {
          csv: {
            filename: undefined,
            columnDelimiter: ",",
            headerCategory: "category",
            headerValue: "value",
            dateFormatter(timestamp) {
              return new Date(timestamp).toDateString();
            },
          },
          svg: {
            filename: undefined,
          },
          png: {
            filename: undefined,
          },
        },
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 3,
        opacity: 0.1,
      },
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: categories,
      title: {
        text: "Category",
      },
      axisBorder: {
        show: true,
        color: colorMode === "light" ? "#16202b" : "#6d89a8",
      },
      labels: {
        formatter: (val) => {
          if (val.length > 5) {
            return val.substring(0, 5) + "...";
          } else {
            return val;
          }
        },
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
        text: "Amount Spent",
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
    title: {
      text: "Group By Category",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
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
        height={350}
        width={"100%"}
      />
    </Suspense>
  );
};

export default CategoryChart;
