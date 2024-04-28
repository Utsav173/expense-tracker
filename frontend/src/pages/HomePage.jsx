import { useEffect, lazy, Suspense, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Grid, Pagination, Typography } from '@mui/material'

// Lazy-loaded components
const Sidebar = lazy(() => import('../components/common/Sidebar'))
const Loader = lazy(() => import('../components/common/Loader'))
const AccountCard = lazy(() => import('../components/home/AccountCard'))
const AddAccount = lazy(() => import('../components/home/AddAccount'))
const SearchList = lazy(() =>
  import('../components/common/SearchList').then(module => ({ default: module.SearchList }))
)

// Other imports
import '../App.css'
import { fetchAccounts, fetchSearchResult } from '../redux/asyncThunk/home'
import { Helmet } from 'react-helmet'
import { setCurrentPage } from '../redux/slice/homeSlice'
import { useSearchParams } from 'react-router-dom'

export function HomePage() {
  const dispatch = useDispatch()
  const accountsData = useSelector(state => state.homePage.accounts)
  const currentPage = useSelector(state => state.homePage.currentPage)
  const totalPage = useSelector(state => state.homePage.totalPage)
  const searchResult = useSelector(state => state.homePage.serachResults)
  const searchResultLoading = useSelector(state => state.homePage.searchResultLoading)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    dispatch(fetchAccounts(currentPage))
  }, [currentPage, dispatch])

  const handlePaginationChange = (event, value) => {
    dispatch(setCurrentPage(value))
  }

  useEffect(() => {
    searchParams.get('q') ? dispatch(fetchSearchResult(searchParams.get('q'))) : null
  }, [dispatch, searchParams])

  return (
    <Sidebar isHomepage={true}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Home | Expense Pro</title>
          <meta
            name='description'
            content='Welcome to homepage of expense pro, where you can find your accounts and create new account for transactions'
          />
          <link rel='canonical' href='https://expense-pro.onrender.com/' />
        </Helmet>
        <Box my={7}>
          <Grid container gap={2} justifyContent='center' direction={'column'}>
            <Box minWidth={'80%'} marginInline={'auto'}>
              {searchResult.length > 0 && searchResultLoading === false && (
                <SearchList searchResult={searchResult} />
              )}
            </Box>
            <Grid textAlign={'center'} item>
              <Typography variant='h4' gutterBottom>
                Welcome to the Expense Pro
              </Typography>
              <AddAccount />
            </Grid>
            <Grid
              container
              gap={3}
              justifyContent='center'
              my={{
                xs: 2,
                sm: 3,
                md: 4
              }}
            >
              {accountsData ? (
                accountsData.map((account, index) => (
                  <Grid
                    item
                    key={`${Math.abs(Math.random() * 100)}-${account.id}`}
                    sm={12}
                    md={6}
                    lg={4}
                    xl={3}
                    sx={{ width: '100%' }}
                  >
                    <AccountCard
                      balance={account.balance}
                      name={account.name}
                      cardNumber={account.id}
                      key={`${account.id}-${index}`}
                      analytics={account.analytics}
                    />
                  </Grid>
                ))
              ) : (
                <Loader diff />
              )}
            </Grid>
            {accountsData.length > 0 && totalPage > 1 && (
              <Box mt={2} display='flex' width={'100%'} justifyContent='center'>
                <Pagination
                  count={totalPage}
                  page={currentPage}
                  onChange={handlePaginationChange}
                  variant='outlined'
                />
              </Box>
            )}
          </Grid>
        </Box>
      </Suspense>
    </Sidebar>
  )
}
