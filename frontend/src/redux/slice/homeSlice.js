import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAccounts,
  fetchSearchResult,
  fetchShareAccounts,
  handleConfirmImport,
  handleCreateAccount,
  handleDelete,
  handleEditAccount,
  handleImportFile,
  userLogout,
} from "../asyncThunk/home";

const initialState = {
  accounts: [],
  status: "idle",
  error: null,
  serachResults: [],
  searchResultLoading: false,
  sharesAccounts: [],
  isLogin: false,
  importFile: null,
  importFileResult: null,
  importingLoading: false,
  deleteLoading: false,
  editLoading: false,
  createLoading: false,
  total: 0,
  pageSize: 10,
};

export const homeSlice = createSlice({
  name: "homePage",
  initialState,
  reducers: {
    setImportFile: (state, action) => {
      state.importFile = action.payload;
    },
    setImportingLoading: (state, action) => {
      state.importingLoading = action.payload;
    },
    setSearchResultLoading: (state, action) => {
      state.searchResultLoading = action.payload;
    },
    setDeleteLoading: (state, action) => {
      state.deleteLoading = action.payload;
    },
    setEditLoading: (state, action) => {
      state.editLoading = action.payload;
    },
    setCreateLoading: (state, action) => {
      state.createLoading = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accounts = action.payload.accounts;
        state.total = action.payload.total;
        state.pageSize = action.payload.limit;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.accounts = [];
      })
      .addCase(fetchSearchResult.fulfilled, (state, action) => {
        state.searchResultLoading = false;
        state.serachResults = action.payload;
      })
      .addCase(fetchSearchResult.rejected, (state, _action) => {
        state.searchResultLoading = false;
        state.serachResults = [];
      })
      .addCase(fetchShareAccounts.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.sharesAccounts = action.payload;
        }
      })
      .addCase(fetchShareAccounts.rejected, (state, _action) => {
        state.sharesAccounts = [];
      })
      .addCase(userLogout.fulfilled, (state, _action) => {
        state.isLogin = false;
      })
      .addCase(handleImportFile.fulfilled, (state, action) => {
        state.importFileResult = action.payload;
        state.importingLoading = false;
      })
      .addCase(handleImportFile.rejected, (state, action) => {
        state.status = "failed";
        state.importingLoading = false;
        state.importFileResult = null;
        state.error = action.payload;
      })
      .addCase(handleConfirmImport.fulfilled, (state, _action) => {
        state.importFileResult = null;
        state.importingLoading = false;
      })
      .addCase(handleConfirmImport.rejected, (state, _action) => {
        state.status = "failed";
        state.importFileResult = null;
        state.importingLoading = false;
      })
      .addCase(handleDelete.fulfilled, (state, _action) => {
        state.deleteLoading = false;
        state.status = "succeeded";
      })
      .addCase(handleDelete.rejected, (state, action) => {
        state.deleteLoading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(handleEditAccount.fulfilled, (state, _action) => {
        state.editLoading = false;
        state.status = "succeeded";
      })
      .addCase(handleEditAccount.rejected, (state, action) => {
        state.editLoading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(handleCreateAccount.fulfilled, (state, _action) => {
        state.createLoading = false;
        state.status = "succeeded";
      })
      .addCase(handleCreateAccount.rejected, (state, action) => {
        state.createLoading = false;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  setImportFile,
  setImportingLoading,
  setSearchResultLoading,
  setDeleteLoading,
  setEditLoading,
  setCreateLoading,
  setPageSize,
} = homeSlice.actions;

export default homeSlice.reducer;
