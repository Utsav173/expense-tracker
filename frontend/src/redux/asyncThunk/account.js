import { createAsyncThunk } from "@reduxjs/toolkit";
import { APIs } from "../../API";
import toast from "react-hot-toast";
import { URL } from "../../API/constant";

export const fetchTransactions = createAsyncThunk(
  "accountPage/fetchTransactions",
  async ({ page, limit, accountId, duration, q }, { rejectWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.GET_TRANSACTIONS}?page=${page || 1}&limit=${
          limit || 10
        }&accountId=${accountId}&duration=${duration || "thisMonth"}&q=${
          q || ""
        }`,
        {},
        {},
        true
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  }
);

export const fetchCategorys = createAsyncThunk(
  "accountPage/fetchCategorys",
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.GET_CATEGORY}?page=1&limit=1000`,
        {},
        {},
        true
      );
      return response.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  }
);

export const fetchDropdownUser = createAsyncThunk(
  "accountPage/fetchDropdownUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIs("GET", `${URL.USER_DROPDOWN}`, {}, {}, true);

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  }
);

export const fetchPreviousShares = createAsyncThunk(
  "accountPage/fetchPreviousShares",
  async ({ accountId }, { rejectWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.GET_PREVIOUS_SHARES}${accountId}`,
        {},
        {},
        true
      );

      return response.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error occurred");
    }
  }
);

export const fetchSignleAccount = createAsyncThunk(
  "accountPage/fetchSignleAccount",
  async ({ accountId, duration }, { rejectWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.ACC_ANALYTICS}${accountId}?duration=${duration || "thisMonth"}`,
        {},
        {},
        true
      );
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message);
      throw error;
    }
  }
);

export const handleCreate = createAsyncThunk(
  "accountPage/handleCreate",
  async (data, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await APIs(
        "POST",
        URL.CREATE_TRANSACTION,
        data,
        {},
        true
      );

      dispatch(
        fetchTransactions({
          page: getState().accountPage.currentPage,
          limit: 10,
          accountId: data.account,
          duration: "thisMonth",
          q: "",
        })
      );
      dispatch(
        fetchSignleAccount({ accountId: data.account, duration: "thisMonth" })
      );
      dispatch(
        fetchIEcharts({ accountId: data.account, duration: "thisMonth" })
      );
      return toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.message);
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const handleEdit = createAsyncThunk(
  "accountPage/handleEdit",
  async ({ id, data, accountId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await APIs(
        "PUT",
        `${URL.UPDATE_TRANSACTION}${id}`,
        data,
        {},
        true
      );

      dispatch(
        fetchTransactions({
          page: getState().accountPage.currentPage,
          limit: 10,
          accountId: accountId,
          duration: "thisMonth",
          q: "",
        })
      );
      dispatch(
        fetchSignleAccount({ accountId: accountId, duration: "thisMonth" })
      );
      dispatch(fetchIEcharts({ accountId: accountId, duration: "thisMonth" }));
      return toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.message);
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const handleDelete = createAsyncThunk(
  "accountPage/handleDelete",
  async ({ id, accountId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await APIs(
        "DELETE",
        `${URL.DELETE_TRANSACTION}${id}`,
        {},
        {},
        true
      );

      dispatch(
        fetchTransactions({
          page: getState().accountPage.currentPage,
          limit: 10,
          accountId: accountId,
          duration: "thisMonth",
          q: "",
        })
      );
      dispatch(
        fetchSignleAccount({ accountId: accountId, duration: "thisMonth" })
      );
      dispatch(fetchIEcharts({ accountId: accountId, duration: "thisMonth" }));
      return toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.message);
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchIEcharts = createAsyncThunk(
  "accountPage/fetchIEcharts",
  async ({ accountId, duration }, { rejectWithValue }) => {
    try {
      const response = await APIs(
        "GET",
        `${URL.BY_INCOME_EXP}?accountId=${accountId}&duration=${
          duration || "thisMonth"
        }`,
        {},
        {},
        true
      );

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error occurred";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
