import { lazy } from "react";
import { ScaleLoader } from "react-spinners";
import { currencyFormat } from "../../../utils";

const Chart = lazy(() => import("react-apexcharts"));

const PieChart = ({ data, themeMode }) => {
  const totalIncome = data.totalIncome;
  const totalExpense = data.totalExpense;

  const series = [totalIncome, totalExpense];
  const labels = ["Total Income", "Total Expense"];

  const options = {
    chart: {
      type: "donut",
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
              show: false,
            },
            value: {
              show: true,
              formatter: (val) => {
                return currencyFormat(val, "scientific");
              },
            },
            total: {
              showAlways: true,
              show: true,
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
        },
      },
    ],
    theme: {
      mode: themeMode,
    },
  };

  return !data || !data.totalIncome || !data.totalExpense ? (
    <ScaleLoader />
  ) : (
    <Chart
      options={options}
      series={series}
      type="donut"
      height={350}
      width={"100%"}
      // style={{ borderRadius: '15px', overflow: 'hidden' }}
    />
  );
};

export default PieChart;
