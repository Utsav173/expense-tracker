import { Button, Stack, useTheme } from "@mui/material";
import React, { Suspense, lazy, useState } from "react";
// import { ScaleLoader } from "react-spinners";
import Loader from "../../common/Loader";

const PieChart = lazy(() => import("./PieChart"));
// const LineChart = lazy(() => import("./LineChart"));

const IEChart = ({ data }) => {
  const theme = useTheme();

  return (
    <Suspense fallback={<Loader diff />}>
      <PieChart data={data} themeMode={theme.palette.mode} />
    </Suspense>
  );
};

export default IEChart;
