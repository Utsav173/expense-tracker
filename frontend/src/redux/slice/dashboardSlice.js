import { createSlice } from "@reduxjs/toolkit";
import {
  fetchByCategory,
  fetchByField,
  fetchDashboardData,
  fetchDashboardIEChart,
  fetchIEData,
} from "../asyncThunk/dashboard";

const initialState = {
  dashboardData: {},
  status: "idle",
  error: null,
  byCategoryData: [],
  byFieldData: [],
  byIEData: [],
  byIEChartData: [],
  duration: "thisMonth",
  field: "transfer",
  balanceChartData: [],
};

export const dashboardSlice = createSlice({
  name: "dashboardPage",
  initialState,
  reducers: {
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setField: (state, action) => {
      state.field = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboardData = action.payload;
        if (action.payload.accountsInfo.length > 0) {
          // make balance chart data like account has 3 then label should be account name and value is balance
          state.balanceChartData = {
            series: action.payload?.accountsInfo?.map(
              (account) => account.balance,
            ),
            labels: action.payload.accountsInfo.map((account) => account.name),
          };
        }
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchByCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byCategoryData = action.payload;
      })
      .addCase(fetchByCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchByField.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byFieldData = action.payload;
      })
      .addCase(fetchByField.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchDashboardIEChart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byIEChartData = action.payload;
      })
      .addCase(fetchDashboardIEChart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchIEData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byIEData = action.payload;
      })
      .addCase(fetchIEData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setDuration, setField } = dashboardSlice.actions;

export const selectDashboardData = (state) => state.dashboardPage.dashboardData;
export const selectByCategoryData = (state) =>
  state.dashboardPage.byCategoryData;
export const selectByFieldData = (state) => state.dashboardPage.byFieldData;
export const selectByIEData = (state) => state.dashboardPage.byIEData;
export const selectByIEChartData = (state) => state.dashboardPage.byIEChartData;
export const selectBalanceChartData = (state) =>
  state.dashboardPage.balanceChartData;

export default dashboardSlice.reducer;
