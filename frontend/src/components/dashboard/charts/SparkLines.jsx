import { lazy } from "react";
import { currencyFormat } from "../../../utils";
import { useTheme } from "@mui/material";
import Loader from "../../common/Loader";
const Chart = lazy(() => import("react-apexcharts"));

const SparkLines = ({ data, type, color, textColor }) => {
  const {
    palette: { mode },
  } = useTheme();
  const series = [
    {
      name: type,
      data: data || [],
    },
  ];

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      type: "area",
      background: "transparent",
      toolbar: {
        show: false,
      },
    },
    grid: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 0.5,
    },
    fill: {
      opacity: mode === "dark" && 0.1,
      type: mode === "light" && "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.3,
      },
    },
    xaxis: {
      type: "datetime",
      crosshairs: {
        width: 1,
      },
      axisBorder: {
        show: true,
        color: textColor,
        height: 0.2,
      },
      axisTicks: {
        show: true,
        color: textColor,
      },
      labels: {
        style: { colors: textColor },
      },
    },
    responsive: [
      {
        breakpoint: 870,
        options: {
          title: {
            style: {
              fontSize: "16px",
            },
          },
        },
      },
    ],
    plotOptions: {
      area: {
        fillTo: "end",
      },
    },
    yaxis: {
      show: false,
    },
    tooltip: {
      theme: mode,
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
    title: {
      text: type,
      offsetX: 0,
      style: {
        fontSize: "22px",
        color: textColor,
      },
    },
    theme: {
      mode: mode,
    },
    colors: [color],
  };
  return !data ? (
    <Loader diff />
  ) : (
    <Chart
      options={options}
      series={series}
      type="area"
      width={"100%"}
      height="100%"
    />
  );
};

export default SparkLines;
