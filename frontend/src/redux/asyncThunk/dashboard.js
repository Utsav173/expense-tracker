import { createAsyncThunk } from "@reduxjs/toolkit";
import { APIs } from "../../API";
import { URL } from "../../API/constant";
import toast from "react-hot-toast";

export const fetchDashboardData = createAsyncThunk(
  "dashboardPage/fetchDashboardData",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs("GET", URL.GET_DASHBOARD, {}, {}, true);
      return fulfillWithValue(response);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  },
);

export const fetchByCategory = createAsyncThunk(
  "dashboardPage/fetchByCategory",
  async ({ duration }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.BY_CATEGORY}?duration=${duration || "thisMonth"}`,
        {},
        {},
        true,
      );
      return fulfillWithValue(response);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  },
);
export const fetchByField = createAsyncThunk(
  "dashboardPage/fetchByField",
  async ({ field, duration }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.BY_FIELD}${field}?duration=${duration || "thisMonth"}`,
        {},
        {},
        true,
      );
      return fulfillWithValue(response);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  },
);
export const fetchDashboardIEChart = createAsyncThunk(
  "dashboardPage/fetchDashboardIEChart",
  async ({ duration }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.BY_I_E_DURATION}?duration=${duration || "thisMonth"}`,
        {},
        {},
        true,
      );

      return fulfillWithValue(response);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  },
);
export const fetchIEData = createAsyncThunk(
  "dashboardPage/fetchIEData",
  async ({ duration }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.BY_INCOME_EXP}?duration=${duration || "thisMonth"}`,
        {},
        {},
        true,
      );
      return fulfillWithValue(response);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  },
);
