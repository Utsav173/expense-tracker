import { Box, Button, Stack, useTheme } from "@mui/material";
import { Suspense, lazy, useState } from "react";
import { currencyFormat } from "../../../utils";
import Loader from "../../common/Loader";
const Chart = lazy(() => import("react-apexcharts"));

const IVEChart = ({ ieChartTwoData }) => {
  const {
    palette: { mode },
  } = useTheme();

  const lightModeColors = ["#5E35B1", "#bf40ff", "#ff4081"];
  const darkModeColors = ["#FF4081", "#0fa7ff", "#00dcff"];
  const [chartType, setChartType] = useState("bar");

  const toggleChartType = () => {
    setChartType(chartType === "bar" ? "line" : "bar");
  };

  const categories = ieChartTwoData?.map((item) => item.date);
  const incomeData = ieChartTwoData?.map((item) => item.income);
  const expenseData = ieChartTwoData?.map((item) => item.expense);
  const balanceData = ieChartTwoData?.map((item) => item.balance);

  const series = [
    {
      name: "Income",
      data: incomeData,
      type: chartType === "line" ? "line" : "bar",
      color: mode === "light" ? lightModeColors[0] : darkModeColors[0],
    },
    {
      name: "Expense",
      data: expenseData,
      type: chartType === "line" ? "line" : "bar",
      color: mode === "light" ? lightModeColors[1] : darkModeColors[1],
    },
  ];

  if (chartType === "line") {
    series.push({
      name: "Balance",
      data: balanceData,
      type: "line",
      color: mode === "light" ? lightModeColors[2] : darkModeColors[2],
    });
  }

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
    stroke: {
      curve: chartType === "line" ? "smooth" : "straight",
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
      text: "Income vs Expense by Duration",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
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
    colors: colors,
  };

  return (
    <Suspense fallback={<Loader diff />}>
      <Stack direction={"column"} spacing={1}>
        <Chart options={options} series={series} height={350} width={"100%"} />
        <Box sx={{ width: "100%" }}>
          <Button fullWidth onClick={toggleChartType}>
            {chartType === "bar"
              ? "Switch to Line Chart"
              : "Switch to Bar Chart"}
          </Button>
        </Box>
      </Stack>
    </Suspense>
  );
};

export default IVEChart;
