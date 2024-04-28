import { Suspense, lazy, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import Loader from '../components/common/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccountsDropdown } from '../redux/asyncThunk/home'
import { URL } from '../API/constant'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Helmet } from 'react-helmet'

const DateRangeSelector = lazy(() => import('../components/common/DateRangeSelector'))
const Sidebar = lazy(() => import('../components/common/Sidebar'))

export function StatementPage() {
  const dispatch = useDispatch()
  const { accountsDropdown: accounts } = useSelector(state => state.homePage)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [exportType, setExportType] = useState('pdf')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [numTransactions, setNumTransactions] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchAccountsDropdown())
  }, [dispatch])

  const handleGenerateStatement = async () => {
    setLoading(true)
    let url = ''

    if (!selectedAccount || (!startDate && !endDate && !numTransactions)) {
      setLoading(false)
      return toast.error(
        'Please select an account and provide either a date range or number of transactions.'
      )
    }

    try {
      url = `${URL.EXPORT_STATEMENT(selectedAccount)}` // Base URL from backend

      const params = {}

      if (startDate && endDate) {
        params.startDate = new Date(startDate).toISOString()
        params.endDate = new Date(endDate).toISOString()
      } else {
        params.numTransactions = numTransactions
      }

      params.exportType = exportType // Assuming exportType query param is same on frontend and backend

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
        },
        params,
        responseType: 'blob' // Request entire response as a blob
      })

      const contentType = response.headers['content-type']
      const blob = new Blob([response.data], { type: contentType }) // Use response content type
      const fileUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = fileUrl
      link.setAttribute('download', exportType === 'xlsx' ? 'statement.xlsx' : 'statement.pdf') // Use filename from header or default
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error('Failed to generate statement. Please try again.')
    } finally {
      setLoading(false)
      setSelectedAccount('')
      setStartDate(null)
      setEndDate(null)
      setNumTransactions('')
      setExportType('pdf')
    }
  }

  const handleStartDateChange = date => {
    setStartDate(date)
  }

  const handleEndDateChange = date => {
    setEndDate(date)
  }

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Account Statement | Expense Pro</title>
          <meta
            name='description'
            content='Welcome to statement page of expense pro, where you can generate statement for your accounts'
          />
          <link rel='canonical' href='https://expense-pro.onrender.com/statement' />
        </Helmet>
        <Box
          mt={7}
          display='flex'
          justifyContent='center'
          alignItems='center'
          flexDirection='column'
          flex={'1 1 auto'}
        >
          <Typography component='h4' variant='h4'>
            Generate Statements
          </Typography>
          <Box
            component={'form'}
            noValidate
            onSubmit={e => {
              e.preventDefault()
              handleGenerateStatement()
            }}
            mt={3}
            sx={{
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Grid item xs={12}>
              <FormControl margin='dense' fullWidth>
                <InputLabel id='account-select-label'>Account</InputLabel>
                <Select
                  labelId='account-select-label'
                  id='account-select'
                  value={selectedAccount}
                  label='Account'
                  onChange={e => setSelectedAccount(e.target.value)}
                >
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select an account to generate statements</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl margin='dense' fullWidth>
                <InputLabel id='export-select-label'>Export to</InputLabel>
                <Select
                  labelId='export-select-label'
                  id='export-select'
                  value={exportType}
                  label='Export to'
                  onChange={e => setExportType(e.target.value)}
                >
                  <MenuItem value='pdf'>PDF</MenuItem>
                  <MenuItem value='xlsx'>Excel</MenuItem>
                </Select>
                <FormHelperText>Select an export type</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <DateRangeSelector
                handleEndDateChange={handleEndDateChange}
                handleStartDateChange={handleStartDateChange}
                startDate={startDate}
                endDate={endDate}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider>OR</Divider>
            </Grid>
            <Grid item xs={12}>
              <FormControl margin='dense' fullWidth>
                <TextField
                  variant='outlined'
                  type='number'
                  name='numTransactions'
                  fullWidth
                  id='number-of-transactions'
                  defaultValue={numTransactions}
                  onChange={e => setNumTransactions(e.target.value)}
                  label='Recent Transactions'
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl margin='dense' fullWidth>
                <Button
                  variant='contained'
                  type='submit'
                  disabled={loading}
                  sx={{
                    backgroundColor: theme =>
                      loading ? 'grey' : theme.palette.mode === 'dark' ? '#ffe878' : '#242d38',
                    color: theme => (theme.palette.mode === 'dark' ? '#241e00' : '#a8caf7'),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? '#ffe04a' : '#24384f',
                      color: theme => (theme.palette.mode === 'dark' ? '#292305' : '#ffffff')
                    }
                  }}
                >
                  Generate
                </Button>
              </FormControl>
            </Grid>
          </Box>
        </Box>
      </Suspense>
    </Sidebar>
  )
}
