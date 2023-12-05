import { useMediaQuery, useTheme } from "@mui/material";
import React, { Suspense, lazy } from "react";
import { currencyFormat } from "../../../utils";
import { useSelector } from "react-redux";
import { selectBalanceChartData } from "../../../redux/slice/dashboardSlice";
import Loader from "../../common/Loader";
const Chart = lazy(() => import("react-apexcharts"));

const BalanceChart = () => {
  const data = useSelector(selectBalanceChartData);

  const {
    palette: { mode: colorMode },
  } = useTheme();
  const isMobile = useMediaQuery("(max-width: 600px)");

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      type: "pie",
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
    stroke: {
      width: 0.5,
      colors: ["transparent"],
    },
    theme: {
      monochrome: {
        enabled: true,
        color: colorMode == "light" ? "#26bdff" : "#f2df35",
      },
      mode: colorMode,
    },
    labels: data.labels,
    tooltip: {
      y: {
        formatter: (val) => {
          return currencyFormat(val, "standard");
        },
      },
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
    legend: {
      fontSize: "14px",
      fontWeight: 600,
      position: "bottom",
      labels: {
        colors: colorMode === "dark" ? "white" : "black",
      },
      formatter: (legendName, opts) => {
        return (
          legendName +
          " : " +
          currencyFormat(opts.w.globals.series[opts.seriesIndex])
        );
      },
    },
    title: {
      text: "Account Balance",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
    },
    noDate: {
      text: "No Data Available",
      offsetX: 14,
    },
  };

  return (
    <Suspense fallback={<Loader diff />}>
      {!data.labels || !data.series ? (
        <Loader diff />
      ) : (
        <Chart
          options={options}
          series={data.series}
          type="pie"
          height={isMobile ? 300 : 400}
          width="100%"
        />
      )}
    </Suspense>
  );
};

export default BalanceChart;
