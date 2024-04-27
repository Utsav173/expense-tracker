import { Suspense, lazy, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import Loader from '../components/common/Loader'

// Lazy-loaded components
const Sidebar = lazy(() => import('../components/common/Sidebar'))
const AccountHeader = lazy(() => import('../components/account/AccountHeader'))
const AccountStat = lazy(() => import('../components/account/AccountStat'))
const DesktopDetailTable = lazy(() => import('../components/account/table/DesktopDetailTable'))
const MobileDetailTable = lazy(() => import('../components/account/table/MobileDetailTable'))
const AccountCharts = lazy(() => import('../components/account/chart/AccountCharts'))

// MUI-related imports batched together
import { Box, Pagination, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { fetchIEcharts, fetchSignleAccount, fetchTransactions } from '../redux/asyncThunk/account'
import { setCurrentPage } from '../redux/slice/accountSlice'
import { Helmet } from 'react-helmet'
import { fetchDashboardIEChart, fetchIEData } from '../redux/asyncThunk/dashboard'
import { useSearchParams } from 'react-router-dom'
import { isFuture, isPast } from 'date-fns'
import toast from 'react-hot-toast'

export function AccountPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { transactions, currentPage, totalCount, totalPages } = useSelector(
    state => state.accountPage
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [startDate, setStartDate] = useState(
    new Date(searchParams.get('duration')?.split(',')[0]) != 'Invalid Date'
      ? new Date(searchParams.get('duration')?.split(',')[0])
      : null
  )
  const [endDate, setEndDate] = useState(
    new Date(searchParams.get('duration')?.split(',')[1]) != 'Invalid Date'
      ? new Date(searchParams.get('duration')?.split(',')[1])
      : null
  )

  const handleStartDateChange = date => {
    if (endDate && isFuture(date)) {
      // Reset end date if start date is greater than end date
      setEndDate('')
      toast.error('Start date must be in the past')
      return
    }
    setStartDate(date)
  }

  const handleEndDateChange = date => {
    if (!startDate) {
      toast.error('Please select a start date first')
      return
    }

    // End date cannot be in the past than start date
    if (isPast(date)) {
      if (isPast(startDate) && isPast(date)) {
        // Ensure end date is not before start date
        if (date < startDate) {
          toast.error('End date must be after start date')
          return
        }
        setEndDate(date)
        setSearchParams({
          duration: String(`${new Date(startDate).toISOString()},${new Date(date).toISOString()}`)
        })
        setStartDate(null)
        setEndDate(null)
      } else {
        toast.error('End date must be in the past')
      }
    } else {
      toast.error('End date must be in the past')
    }
  }

  useEffect(() => {
    const abortController = new AbortController() // Create AbortController instance
    dispatch(
      fetchTransactions({
        accountId: id,
        limit: 10,
        page: currentPage,
        duration: searchParams.get('duration') || 'thisMonth',
        q: searchParams.get('q') || ''
      })
    )
    return () => {
      abortController.abort()
    }
  }, [id, dispatch, currentPage, searchParams])

  useEffect(() => {
    const fetchTransactionsData = async () => {
      setLoading(true)

      await Promise.all([
        dispatch(
          fetchSignleAccount({
            accountId: id,
            duration: searchParams.get('duration') || 'thisMonth'
          })
        ),
        dispatch(
          fetchIEcharts({
            accountId: id,
            duration: searchParams.get('duration') || 'thisMonth'
          })
        ),
        dispatch(
          fetchIEData({ duration: searchParams.get('duration') || 'thisMonth', accountId: id })
        ),
        dispatch(
          fetchDashboardIEChart({
            duration: searchParams.get('duration') || 'thisMonth',
            accountId: id
          })
        )
      ])

      setLoading(false)
    }

    fetchTransactionsData()
  }, [dispatch, id, searchParams])

  const handleApplyFilter = event => {
    setStartDate(null)
    setEndDate(null)
    dispatch(setCurrentPage(1))
    setSearchParams({ duration: event.target.value })
  }

  const handlePaginationChange = (event, value) => {
    dispatch(setCurrentPage(value))
  }

  return (
    <Sidebar isHomepage={false} isLoading={loading}>
      <Helmet>
        <title>Account | Expense Pro</title>
        <meta
          name='description'
          content='Detail account page where you can manage transaction related to this account and share account to other also has income expense chart'
        />
      </Helmet>
      <Box my={6} mx={{ xs: 1, md: 2 }} overflow={'auto'}>
        <Paper
          sx={{
            width: '100%',
            padding: 2,
            gap: 4
          }}
          elevation={0}
        >
          {transactions.length !== 0 && (
            <AccountStat duration={searchParams.get('duration') || 'thisMonth'} />
          )}
          <AccountHeader
            id={id}
            duration={searchParams.get('duration') || 'thisMonth'}
            handleApplyFilter={handleApplyFilter}
            startDate={startDate}
            endDate={endDate}
            handleEndDateChange={handleEndDateChange}
            handleStartDateChange={handleStartDateChange}
            setQ={setSearchParams}
          />
          {transactions.length !== 0 && <AccountCharts />}
          {transactions.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                borderRadius: '9px',
                boxShadow: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgb(174 173 173 / 25%) 0px 4px 9px -2px, rgb(39 45 49 / 50%) 0px 0px 0px 1px'
                    : 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                py: 2
              }}
            >
              <Typography fontWeight={'bold'}>No transactions found</Typography>
            </Box>
          ) : (
            <Suspense fallback={<Loader diff />}>
              {isMobile ? (
                <MobileDetailTable />
              ) : (
                <DesktopDetailTable
                  totalPages={totalCount}
                  pageSize={transactions.pageSize}
                  page={currentPage}
                  setQ={setSearchParams}
                />
              )}
            </Suspense>
          )}
        </Paper>
        {transactions.length > 0 && (
          <Box mt={2} display='flex' width={'100%'} justifyContent='center'>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePaginationChange}
              variant='outlined'
            />
          </Box>
        )}
      </Box>
    </Sidebar>
  )
}
