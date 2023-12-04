import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCategorys,
  fetchDropdownUser,
  fetchIEcharts,
  fetchPreviousShares,
  fetchSignleAccount,
  fetchTransactions,
  handleCreate,
  handleEdit,
  handleDelete,
} from "../asyncThunk/account";

const initialState = {
  transactions: [],
  categorys: [],
  dropdownUsers: [],
  previousShares: [],
  status: "idle",
  error: null,
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  accountStat: {},
  amountCharts: {},
};

export const accountSlice = createSlice({
  name: "accountPage",
  initialState,
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setTotalCount: (state, action) => {
      state.totalCount = action.payload;
    },
    setTotalPages: (state, action) => {
      state.totalPages = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.transactions = action.payload.transactions || [];
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategorys.fulfilled, (state, action) => {
        state.categorys = action.payload;
      })
      .addCase(fetchDropdownUser.fulfilled, (state, action) => {
        state.dropdownUsers = action.payload;
      })
      .addCase(fetchPreviousShares.fulfilled, (state, action) => {
        state.previousShares = action.payload;
      })
      .addCase(fetchSignleAccount.fulfilled, (state, action) => {
        console.log("action.payload", action.payload);
        state.accountStat = action.payload;
      })
      .addCase(fetchSignleAccount.rejected, (state, action) => {
        state.accountStat = {
          error: action.payload || "Error occurred",
        };
      })
      .addCase(fetchIEcharts.fulfilled, (state, action) => {
        state.amountCharts = action.payload;
      })
      .addCase(fetchIEcharts.rejected, (state, action) => {
        state.amountCharts = {
          error: action.payload || "Error occurred",
        };
      })
      .addCase(handleCreate.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(handleCreate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(handleEdit.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(handleEdit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(handleDelete.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(handleDelete.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setTransactions, setCurrentPage, setTotalCount } =
  accountSlice.actions;

export default accountSlice.reducer;
