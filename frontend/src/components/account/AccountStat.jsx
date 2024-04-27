import { Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import { Box, Skeleton, Tooltip, Typography, styled, useTheme } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { currencyFormat, getDurationInterval } from '../../utils'
import Loader from '../common/Loader'
import useMediaQuery from '@mui/material/useMediaQuery'

const AccStatChart = lazy(() => import('./chart/AccStatChart'))
const AccBalanceChart = lazy(() => import('./chart/AccBalanceChart'))

const StatsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  position: 'relative',
  borderRadius: '10px',
  zIndex: 1
}))

const StatChartBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  zIndex: 0,
  bottom: theme.palette.mode === 'light' ? 3 : 5,
  width: '100%',
  opacity: 0.8
}))

const StatTextBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  background: 'transparent'
}))

const AccountStat = ({ duration }) => {
  const { accountStat, amountCharts, accountStatLoading } = useSelector(state => state.accountPage)
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.up('lg'))

  return (
    <Suspense fallback={<Loader diff />}>
      {accountStatLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            width: '100%',
            gap: {
              xs: 2,
              md: 3
            },
            justifyContent: 'space-between',
            alignItems: 'stretch',
            marginBottom: 3
          }}
        >
          <Skeleton variant='rectangular' width={'100%'} />
          <Skeleton variant='rectangular' width={'100%'} />
          <Skeleton variant='rectangular' width={'100%'} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            width: '100%',
            gap: {
              xs: 2,
              md: 3
            },
            justifyContent: 'space-between',
            alignItems: 'stretch',
            marginBottom: 3
          }}
        >
          <StatsContainer
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#161c16' : '#ebffebBF',
              boxShadow: theme =>
                theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04) 0px 3px 5px;'
                  : 'rgba(25, 41, 25, 0.9) 0px 0px 17px inset;',
              border: theme => theme.palette.mode === 'dark' && '0.15px solid',
              borderColor: theme => theme.palette.mode === 'dark' && '#0f170f'
            }}
          >
            <StatTextBox>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ color: 'inherit', fontSize: '20px', zIndex: 100 }}
              >
                Income
              </Typography>
              <Typography
                variant='h5'
                gutterBottom
                sx={{
                  zIndex: 100,
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? '#75c783' : '#1e2620')
                }}
              >
                {currencyFormat(accountStat?.income)}
              </Typography>
              <Box
                display='inline-flex'
                fontSize={12}
                alignItems='center'
                color={'green'}
                zIndex={100}
              >
                <Typography fontSize={12}>
                  {accountStat.IncomePercentageChange || 'infinity'}%
                </Typography>
                {accountStat.IncomePercentageChange > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 13, color: 'green', marginInline: 0.6 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 13, color: 'green', marginInline: 0.6 }} />
                )}
                {matches && <Typography fontSize={12}>{getDurationInterval[duration]}</Typography>}
              </Box>
            </StatTextBox>
            <Suspense fallback={<Loader diff />}>
              <StatChartBox>
                <AccStatChart icomeType={true} data={amountCharts.income} />
              </StatChartBox>
            </Suspense>
          </StatsContainer>
          <StatsContainer
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1e2124' : '#ebf7ffBF',
              boxShadow: theme =>
                theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04) 0px 3px 5px;'
                  : 'rgba(0, 0, 0, 0.3) 0px 0px 17px inset;',
              border: theme => theme.palette.mode === 'dark' && '0.15px solid',
              borderColor: theme => theme.palette.mode === 'dark' && '#111417'
            }}
          >
            <StatTextBox>
              <Typography variant='h6' gutterBottom>
                Balance
              </Typography>

              <Tooltip title='this balance is only related to the duration and it not sync with main balance'>
                <Typography
                  variant='h5'
                  gutterBottom
                  fontWeight={'bold'}
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? '#759ec7' : '#161c21')
                  }}
                >
                  {currencyFormat(accountStat?.balance)}
                </Typography>
              </Tooltip>

              <Box
                display='inline-flex'
                alignItems='center'
                color={'#759ec1'}
                fontSize={12}
                zIndex={100}
              >
                <Typography fontSize={12}>
                  {accountStat.BalancePercentageChange || 'infinity'}%
                </Typography>
                {accountStat.BalancePercentageChange > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 13, color: '#759ec1', marginInline: 0.6 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 13, color: '#759ec1', marginInline: 0.6 }} />
                )}
                {matches && <Typography fontSize={12}>{getDurationInterval[duration]}</Typography>}
              </Box>
            </StatTextBox>
            <StatChartBox>
              <AccBalanceChart data={amountCharts.balance} />
            </StatChartBox>
          </StatsContainer>
          <StatsContainer
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1414' : '#ffd9d9BF',
              boxShadow: theme =>
                theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04) 0px 3px 5px;'
                  : 'rgba(41, 25, 25, 0.9) 0px 0px 17px inset;',
              border: theme => theme.palette.mode === 'dark' && '0.15px solid',
              borderColor: theme => theme.palette.mode === 'dark' && 'rgba(41, 25, 25, 0.8)'
            }}
          >
            <StatTextBox>
              <Typography variant='h6' gutterBottom>
                Expense
              </Typography>
              <Typography
                variant='h5'
                gutterBottom
                sx={{
                  zIndex: 100,
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? '#db6e6e' : '#261e1e')
                }}
              >
                {currencyFormat(accountStat?.expense)}
              </Typography>
              <Box
                display='inline-flex'
                alignItems='center'
                color={'red'}
                fontSize={12}
                zIndex={100}
              >
                <Typography fontSize={12}>
                  {accountStat.ExpensePercentageChange || 'infinity'}%
                </Typography>
                {accountStat.ExpensePercentageChange > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 13, color: 'red', marginInline: 0.6 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 13, color: 'red', marginInline: 0.6 }} />
                )}
                {matches && <Typography fontSize={12}>{getDurationInterval[duration]}</Typography>}
              </Box>
            </StatTextBox>
            <Suspense fallback={<Loader diff />}>
              <StatChartBox>
                <AccStatChart icomeType={false} data={amountCharts.expense} />
              </StatChartBox>
            </Suspense>
          </StatsContainer>
        </Box>
      )}
    </Suspense>
  )
}

export default AccountStat
