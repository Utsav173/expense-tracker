import React, { lazy } from "react";
import { useTheme } from "@mui/material";
import { ApexOptions } from "apexcharts";
import { currencyFormat } from "../../../utils";
import { ScaleLoader } from "react-spinners";
const Chart = lazy(() => import("react-apexcharts"));

const AccBalanceChart = ({ height = 100, data }) => {
  const theme = useTheme();

  const series = [
    {
      name: "Balance",
      data: data || [],
    },
  ];

  /** @type {ApexOptions} */
  const options = {
    chart: {
      type: "area",
      width: "100%",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      area: {
        fillTo: "end",
      },
    },
    stroke: {
      curve: "straight",
      width: 1,
    },
    fill: {
      opacity: 0.5,
      type: "gradient",
      gradient: {
        shade: theme.palette.mode,
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: [
          theme.palette.mode === "light" ? "#0e6ab580" : "#1f8ae080",
        ],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    yaxis: {
      show: false,
    },
    colors: [theme.palette.mode === "light" ? "#0e6ab580" : "#1f8ae080"],
    tooltip: {
      theme: theme.palette.mode,
      x: {
        show: false,
      },
      y: {
        formatter: function (val) {
          return currencyFormat(val, "standard");
        },
      },
      marker: {
        show: false,
      },
    },
  };
  return (
    <React.Suspense
      fallback={
        <ScaleLoader
          color={theme.palette.mode === "light" ? "#000000" : "#ffffff"}
        />
      }
    >
      <Chart
        options={options}
        series={series}
        type="area"
        width={"100%"}
        height={height}
      />
    </React.Suspense>
  );
};

export default AccBalanceChart;
