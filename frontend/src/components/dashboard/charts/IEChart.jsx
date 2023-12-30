import { Button, Stack, useTheme } from "@mui/material";
import React, { Suspense, lazy, useState } from "react";
// import { ScaleLoader } from "react-spinners";
import Loader from "../../common/Loader";

const PieChart = lazy(() => import("./PieChart"));
// const LineChart = lazy(() => import("./LineChart"));

const IEChart = ({ data }) => {
  const [showLineChart, setShowLineChart] = useState(true);
  const theme = useTheme();
  const toggleChart = () => {
    setShowLineChart(!showLineChart);
  };

  return (
    <Suspense fallback={<Loader diff />}>
      {/* <Stack direction={"column"} spacing={2} width={"100%"}>
        {showLineChart ? (
          <LineChart data={data} themeMode={theme.palette.mode} />
        ) : ( */}
      <PieChart data={data} themeMode={theme.palette.mode} />
      {/* )}
        <Button onClick={toggleChart}>
          {showLineChart ? "Show Pie Chart" : "Show Line Chart"}
        </Button>
      </Stack> */}
    </Suspense>
  );
};

export default IEChart;
