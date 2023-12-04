import { lazy } from "react";
import { ScaleLoader } from "react-spinners";
const Chart = lazy(() => import("react-apexcharts"));

const LineChart = ({ data, themeMode }) => {
  const incomeData =
    data.income &&
    data.income.map((item) => ({
      x: new Date(item.createdAt).getTime(), // Using timestamp as x-value
      y: item.amount,
    }));

  const expenseData =
    data.expense &&
    data.expense.map((item) => ({
      x: new Date(item.createdAt).getTime(), // Using timestamp as x-value
      y: item.amount,
    }));

  const series = [
    { name: "Income", data: incomeData },
    { name: "Expense", data: expenseData },
  ];

  const options = {
    chart: {
      type: "line",
      height: 350,
      background: "transparent",
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
    },
    grid: {
      show: false,
    },
    xaxis: {
      type: "datetime", // Setting x-axis type to datetime
      axisBorder: {
        show: true,
        color: themeMode === "light" ? "#473069" : "#c096ff",
      },
      labels: {
        show: true,
        style: {
          colors: themeMode === "light" ? "#333" : "#fff",
        },
      },
    },
    yaxis: {
      title: {
        text: "Amount",
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: themeMode === "light" ? "#473069" : "#c096ff", // X-axis border color
      },
      axisTicks: {
        show: true,
        color: themeMode === "light" ? "#473069" : "#c096ff", // X-axis border color
      },
    },
    title: {
      text: "Income vs Expense Line Chart",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
    },
    theme: {
      mode: themeMode,
    },
    colors: ["#5E35B1", "#EF6C00"],
  };

  return !data || !data.income || !data.expense ? (
    <ScaleLoader />
  ) : (
    <Chart
      options={options}
      series={series}
      type="line"
      height={350}
      width={"100%"}
      // style={{ borderRadius: '15px', overflow: 'hidden' }}
    />
  );
};

export default LineChart;
