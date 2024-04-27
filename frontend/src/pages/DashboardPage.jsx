import { Suspense, lazy, useEffect, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'

import Loader from '../components/common/Loader'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchByCategory,
  fetchByField,
  fetchDashboardData,
  fetchDashboardIEChart,
  fetchIEData
} from '../redux/asyncThunk/dashboard'
import { Helmet } from 'react-helmet'
import { setDuration, setField } from '../redux/slice/dashboardSlice'
import { isFuture, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { PropagateLoader } from 'react-spinners'

const Sidebar = lazy(() => import('../components/common/Sidebar'))
const DashboardContent = lazy(() => import('../components/dashboard/DashboardContent'))
const DashBoradHeader = lazy(() => import('../components/dashboard/DashBoradHeader'))
const DashboardStat = lazy(() => import('../components/dashboard/DashboardStat'))

export function DashboardPage() {
  const dispatch = useDispatch()
  const { duration, field, dashboardData } = useSelector(state => state.dashboardPage)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(
    new Date(duration?.split(',')[0]) != 'Invalid Date' ? new Date(duration?.split(',')[0]) : null
  )
  const [endDate, setEndDate] = useState(
    new Date(duration?.split(',')[1]) != 'Invalid Date' ? new Date(duration?.split(',')[1]) : null
  )

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      await Promise.all([
        dispatch(fetchDashboardData()),
        dispatch(fetchByCategory({ duration: duration })),
        dispatch(fetchByField({ duration: duration, field: field })),
        dispatch(fetchDashboardIEChart({ duration: duration })),
        dispatch(fetchIEData({ duration: duration }))
      ])
      setLoading(false)
    }

    fetchData()
  }, [dispatch, duration, field])

  const handleApplyFilter = e => {
    dispatch(setDuration(e.target.value))
  }

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
        dispatch(
          setDuration(`${new Date(startDate).toISOString()},${new Date(endDate).toISOString()}`)
        )
        setStartDate(null)
        setEndDate(null)
      } else {
        toast.error('End date must be in the past')
      }
    } else {
      toast.error('End date must be in the past')
    }
  }
  return (
    <Sidebar isHomepage={false} isLoading={loading}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Dashboard | Expense Pro</title>
          <meta
            name='description'
            content='Welcome to dashboard of expense pro, where you can find multiple analytics of your accounts with different chart and useful information'
          />
          <link rel='canonical' href='https://track-expense-tan.vercel.app/dashboard' />
        </Helmet>
        {dashboardData.totalTransaction < 4 ? (
          <Box
            my={7}
            sx={{
              width: '100%',
              display: 'flex',
              minHeight: '80vh',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <PropagateLoader
              color={theme => (theme.palette.mode === 'light' ? '#000000' : '#ffffff')}
            />
            <Typography variant='h5'>No Enough Data</Typography>
          </Box>
        ) : (
          <Box
            my={7}
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <DashboardStat />
            <Stack width={'100%'} spacing={2} my={2}>
              <DashBoradHeader
                startDate={startDate}
                endDate={endDate}
                handleApplyFilter={handleApplyFilter}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
              />
              <DashboardContent />
            </Stack>
          </Box>
        )}
      </Suspense>
    </Sidebar>
  )
}
