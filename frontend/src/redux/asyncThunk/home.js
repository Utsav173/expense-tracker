import { createAsyncThunk } from '@reduxjs/toolkit'
import { APIs } from '../../API'
import { URL } from '../../API/constant'
import toast from 'react-hot-toast'
import {
  setCreateLoading,
  setDeleteLoading,
  setEditLoading,
  setSearchResultLoading
} from '../slice/homeSlice'

export const fetchAccounts = createAsyncThunk(
  'homePage/fetchAccounts',
  async (currentPage, { rejectWithValue, fulfillWithValue, getState }) => {
    try {
      const page = currentPage || getState().homePage.currentPage
      const response = await APIs('GET', `${URL.GET_ACCOUNTS}?page=${page}`, {}, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)
export const fetchAccountsDropdown = createAsyncThunk(
  'homePage/fetchAccountsDropdown',
  async (_, { rejectWithValue, fulfillWithValue, getState }) => {
    try {
      const response = await APIs('GET', URL.GET_ACCOUNTS_DROPDOWN, {}, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const userLogout = createAsyncThunk(
  'homePage/userLogout',
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs('POST', URL.LOGOUT, {}, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const fetchShareAccounts = createAsyncThunk(
  'homePage/fetchShareAccounts',
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs('GET', URL.GET_SHARE_ACC, {}, {}, true)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)


export const fetchSearchResult = createAsyncThunk(
  'homePage/fetchSearchResult',
  async (q, { rejectWithValue, fulfillWithValue, dispatch }) => {
    try {
      dispatch(setSearchResultLoading(true))
      const response = await APIs(
        'GET',
        `${URL.SEARCH_ALL}${q && q.trim().length > 0 ? `?q=${q}` : ''}`,
        {},
        {},
        true
      )
      if (response.length === 0) {
        toast('No search result found')
      }
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const handleImportFile = createAsyncThunk(
  'homePage/handleImportFile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await APIs('POST', `${URL.IMPORT_TRANSACTIONS}`, data, {}, true)
      return response // Return response directly when fulfilled
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const handleConfirmImport = createAsyncThunk(
  'homePage/handleConfirmImport',
  async (id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await APIs('POST', `${URL.CONFIRM_IMPORT}${id}`, {}, {}, true)
      toast.success(response.message)
      return fulfillWithValue(response)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    }
  }
)

export const handleDelete = createAsyncThunk(
  'homePage/handleDelete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setDeleteLoading(true))
      const response = await APIs('DELETE', `${URL.DELETE_ACCOUNT}${id}`, {}, {}, true)
      return toast.success(response.message)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    } finally {
      dispatch(fetchAccounts())
    }
  }
)
export const handleCreateAccount = createAsyncThunk(
  'homePage/handleCreateAccount',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setCreateLoading(true))
      const response = await APIs('POST', URL.CREATE_ACCOUNT, data, {}, true)
      return toast.success(response.message)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    } finally {
      dispatch(fetchAccounts())
    }
  }
)
export const handleEditAccount = createAsyncThunk(
  'homePage/handleEditAccount',
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setEditLoading(true))
      const response = await APIs('PUT', `${URL.UPDATE_ACCOUNT}${id}`, data, {}, true).then(res => {
        if (res.message) {
          dispatch(fetchAccounts())
        }
      })
      return toast.success(response.message)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error occurred')
    } finally {
      dispatch(fetchAccounts())
    }
  }
)
