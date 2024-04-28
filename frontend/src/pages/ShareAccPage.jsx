import { Suspense, lazy, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { fetchShareAccounts } from '../redux/asyncThunk/home'
import Loader from '../components/common/Loader'
import { Helmet } from 'react-helmet'
import { PropagateLoader } from 'react-spinners'

const ShareAccCard = lazy(() => import('../components/home/ShareAccCard'))
const Sidebar = lazy(() => import('../components/common/Sidebar'))

export function ShareAccPage() {
  const dispatch = useDispatch()
  const { sharesAccounts } = useSelector(state => state.homePage)
  useEffect(() => {
    dispatch(fetchShareAccounts())
  }, [dispatch])

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Share Accounts | Expense Pro</title>
          <meta
            name='description'
            content='Share accounts page where you can find shared accounts which shared by others to you'
          />
          <link rel='canonical' href='https://expense-pro.onrender.com/share-accounts' />
        </Helmet>
        {sharesAccounts.length > 0 ? (
          <Box
            my={6}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%'
            }}
          >
            {sharesAccounts.map(account => (
              <ShareAccCard
                key={account.id}
                owner={account.owner.name}
                balance={account.balance}
                id={account.id}
                name={account.name}
              />
            ))}
          </Box>
        ) : (
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
            <Typography variant='h5'>No Share Account Found</Typography>
          </Box>
        )}
      </Suspense>
    </Sidebar>
  )
}
