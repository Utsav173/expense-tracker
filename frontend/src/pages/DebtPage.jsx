import { Suspense, lazy, useEffect } from 'react'
import { Box, Pagination, Paper, Typography, useMediaQuery } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/common/Loader'
import { Helmet } from 'react-helmet'
import { PropagateLoader } from 'react-spinners'
import { fetchDebtsList } from '../redux/asyncThunk/debt'
import DebtsHeader from '../components/debt/DebtsHeader'
import { useTheme } from '@emotion/react'
import DesktopListTable from '../components/debt/table/DesktopListTable'
import { setCurrentPage } from '../redux/slice/debtSlice'
import MobileListTable from '../components/debt/table/MobileListTable'
import CalculateIntrest from '../components/debt/CalculateIntrest'

const Sidebar = lazy(() => import('../components/common/Sidebar'))

export function DebtPage() {
  const dispatch = useDispatch()
  const { debtsList, isLoading, totalCount, currentPage, totalPages } = useSelector(
    state => state.debtPage
  )
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    dispatch(fetchDebtsList())
  }, [dispatch])

  const handlePaginationChange = (event, value) => {
    dispatch(setCurrentPage(value))
  }

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Debts | Expense Pro</title>
          <meta
            name='description'
            content='Debt page where you can find shared accounts which shared by others to you'
          />
          <link rel='canonical' href='https://track-expense-tan.vercel.app/debts' />
        </Helmet>
        <Box
          my={6}
          mx={{ xs: 1, md: 2 }}
          overflow={'auto'}
          sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <Box my={2}>
            <CalculateIntrest />
          </Box>
          <Paper
            sx={{
              width: '100%',
              padding: 2,
              gap: 4
            }}
            elevation={0}
          >
            <DebtsHeader
            // id={id}
            // duration={searchParams.get('duration') || 'thisMonth'}
            // handleApplyFilter={handleApplyFilter}
            // startDate={startDate}
            // endDate={endDate}
            // handleEndDateChange={handleEndDateChange}
            // handleStartDateChange={handleStartDateChange}
            // setQ={setSearchParams}
            />
            {debtsList.length === 0 ? (
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
                <Typography fontWeight={'bold'}>No debtsList found</Typography>
              </Box>
            ) : (
              <Suspense fallback={<Loader diff />}>
                {isLoading ? (
                  <PropagateLoader />
                ) : isMobile ? (
                  <MobileListTable />
                ) : (
                  <DesktopListTable
                    totalPages={totalCount}
                    pageSize={debtsList.pageSize}
                    page={currentPage}
                  />
                )}
              </Suspense>
            )}
          </Paper>
          {debtsList.length > 0 && (
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
      </Suspense>
    </Sidebar>
  )
}
