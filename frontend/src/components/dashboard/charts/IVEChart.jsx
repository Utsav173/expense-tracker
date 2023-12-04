import { useTheme } from "@mui/material";
import { Suspense, lazy } from "react";
import { currencyFormat } from "../../../utils";
import { ScaleLoader } from "react-spinners";

const Chart = lazy(() => import("react-apexcharts"));

const IVEChart = ({ ieChartTwoData }) => {
  const {
    palette: { mode },
  } = useTheme();

  const lightModeColors = ["#5E35B1", "#bf40ff"];
  const darkModeColors = ["#FF4081", "#0fa7ff"];

  const categories = ieChartTwoData?.map((item) => item.date);
  const incomeData = ieChartTwoData?.map((item) => item.income);
  const expenseData = ieChartTwoData?.map((item) => item.expense);

  const series = [
    {
      name: "Income",
      data: incomeData,
      color: mode === "light" ? lightModeColors[0] : darkModeColors[0],
    },
    {
      name: "Expense",
      data: expenseData,
      color: mode === "light" ? lightModeColors[1] : darkModeColors[1],
    },
  ];

  const colors = mode === "light" ? lightModeColors : darkModeColors;

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
        opacity: 0.2,
      },
    },
    grid: {
      show: false,
    },
    theme: {
      mode: mode,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        dataLabels: {
          position: "top",
        },
      },
    },
    xaxis: {
      // type: 'datetime',
      categories: categories,
      title: {
        text: "Duration",
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: mode === "light" ? "#16202b" : "#c2cbff", // X-axis border color
      },
    },
    yaxis: {
      title: {
        text: "Amount",
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: mode === "light" ? "#16202b" : "#c2cbff", // X-axis border color
      },
      axisTicks: {
        show: true,
        color: mode === "light" ? "#16202b" : "#c2cbff", // X-axis border color
      },
      labels: {
        formatter: (val) => currencyFormat(val, "compact"),
      },
    },
    title: {
      text: "ncome vs Expense by Duration",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
    },
    colors: colors,
  };

  return (
    <Suspense fallback={<ScaleLoader />}>
      <Chart
        options={options}
        series={series}
        type="bar"
        height={350}
        width={"100%"}
        // style={{ borderRadius: '15px', overflow: 'hidden' }}
      />
    </Suspense>
  );
};

export default IVEChart;
