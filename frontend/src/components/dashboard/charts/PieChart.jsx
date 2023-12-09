import { lazy } from "react";
import { currencyFormat } from "../../../utils";
import Loader from "../../common/Loader";
import { useMediaQuery } from "@mui/material";
const Chart = lazy(() => import("react-apexcharts"));

const PieChart = ({ data, themeMode }) => {
  const totalIncome = data.totalIncome;
  const totalExpense = data.totalExpense;

  const isMobile = useMediaQuery("(max-width: 600px)");

  const series = [totalIncome, totalExpense];
  const labels = ["Total Income", "Total Expense"];

  const options = {
    chart: {
      type: "donut",
      background: "transparent",
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
    labels: labels,
    stroke: {
      width: 0.5,
      colors: ["transparent"],
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
            },
            value: {
              show: true,
              formatter: (val) => {
                return currencyFormat(val, "scientific");
              },
              fontWeight: "bold",
            },
            total: {
              showAlways: true,
              show: true,
              label:"Balance"
            },
          },
        },
      },
    },
    title: {
      text: "Total Income vs Total Expense Pie Chart",
      style: {
        fontSize: "16px",
      },
      offsetX: 14,
    },
    legend: {
      show: true,
      position: "bottom",
    },
    responsive: [
      {
        breakpoint: 870,
        options: {
          legend: {
            show: false,
          },
          title: {
            style: {
              fontSize: "10px",
            },
          },
        },
      },
    ],
    theme: {
      mode: themeMode,
    },
  };

  return !data || !data.totalIncome || !data.totalExpense ? (
    <Loader diff />
  ) : (
    <Chart
      options={options}
      series={series}
      type="donut"
      height={isMobile ? 300 : 400}
      width="100%"
    />
  );
};

export default PieChart;
