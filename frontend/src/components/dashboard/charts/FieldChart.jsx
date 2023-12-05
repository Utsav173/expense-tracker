import { Button, Stack, useTheme } from "@mui/material";
import { Suspense, lazy, useState } from "react";
import Loader from "../../common/Loader";
const Chart = lazy(() => import("react-apexcharts"));

const FieldChart = ({ fieldChartData }) => {
  const {
    palette: { mode },
  } = useTheme();
  const [showRecent, setShowRecent] = useState(10);
  const maxEntries = fieldChartData.length;
  const labels = fieldChartData.slice(0, showRecent).map((data) => data.label);
  const counts = fieldChartData.slice(0, showRecent).map((data) => data.count);
  const series = [{ data: counts }];

  const options = {
    chart: {
      background: "transparent",
      type: "bar",
      height: 350,
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
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
      },
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: labels,
      title: {
        text: "Labels",
      },
      axisBorder: {
        show: true,
        color: mode === "light" ? "#16202b" : "#add1ff",
      },
    },
    yaxis: {
      title: {
        text: "Counts",
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: mode === "light" ? "#16202b" : "#add1ff", // X-axis border color
      },
      axisTicks: {
        show: true,
        color: mode === "light" ? "#16202b" : "#add1ff", // X-axis border color
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val) {
          return `Count: ${val}`;
        },
        title: {
          formatter: (seriesName) => seriesName,
        },
      },
    },
    theme: {
      mode: mode,
    },
    title: {
      text: "Field Chart",
      style: {
        // color: colorMode === 'light' ? '#858585' : '#e8e8e8',
        fontSize: "16px",
      },
      offsetX: 14,
    },
  };

  const handleShowMore = () => {
    const newShowRecent = showRecent + 10;
    if (newShowRecent > fieldChartData.length || newShowRecent > maxEntries) {
      setShowRecent(fieldChartData.length);
    } else {
      setShowRecent(newShowRecent);
    }
  };
  const shouldShowMoreButton = showRecent < maxEntries;
  return (
    <Suspense fallback={<Loader diff />}>
      <Stack direction={"column"} spacing={2}>
        <Chart
          options={options}
          series={series}
          type="bar"
          height={350}
          width={"100%"}
        />
        {shouldShowMoreButton && (
          <Button onClick={handleShowMore}>Show More</Button>
        )}
      </Stack>
    </Suspense>
  );
};

export default FieldChart;
